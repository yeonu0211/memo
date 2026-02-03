// 1. Supabase 접속 설정
const SUPABASE_URL = 'https://nwyucikmofvsoankgfhy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eXVjaWttb2Z2c29hbmtnZmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTYwMzgsImV4cCI6MjA4NTY5MjAzOH0.stW6jDfJUm-Out9E3r3wjMmWsHXtfFVPb4AdM8iKPR0';
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 페이지가 로드되면 실행
window.onload = () => {
    // 기존 기능: 데이터 불러오기
    fetchInsights();
    
    const enterBtn = document.getElementById('enter-btn');
    const book = document.getElementById('main-book');
    const introScreen = document.getElementById('intro-screen');
    const mainContent = document.getElementById('main-content');
    
    enterBtn.onclick = () => {
        // 1. 책 열리는 애니메이션 시작
        book.classList.add('open');
        enterBtn.style.opacity = '0';
    
        // 2. 1.5초 뒤 인트로 화면 사라지고 메인 컨텐츠 등장
        setTimeout(() => {
            introScreen.style.opacity = '0';
            setTimeout(() => {
                introScreen.style.display = 'none';
                mainContent.style.display = 'block';
                // 메인 화면이 켜지면서 데이터 다시 호출 (레이아웃 깨짐 방지)
                fetchInsights();
            }, 1000);
        }, 1500);
    };
        
    // 신규 기능: 모달 제어 로직
    const modal = document.getElementById('modal-overlay');
    const addBtn = document.getElementById('add-btn');
    const closeBtn = document.getElementById('close-modal');
    const dateInput = document.getElementById('date-input');

    // 1) 오늘 날짜를 기본값으로 설정 (한국 시간 기준)
    if (dateInput) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset).toISOString().split('T')[0];
        dateInput.value = localDate;
    }

    // 2) 모달 열기 버튼 클릭 시
    addBtn.onclick = () => {
        modal.style.display = 'flex';
    };

    // 3) 닫기 버튼(X) 클릭 시
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // 4) 모달 바깥 어두운 배경 클릭 시 닫기
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
};
// 3. 전체 데이터 불러오기 함수
async function fetchInsights() {
    const { data, error } = await _supabase
        .from('posts')
        .select('*')
        .order('recorded_at', { ascending: false });

    if (error) {
        console.error('데이터 호출 에러:', error);
    } else {
        displayInsights(data);
    }
}

// 4. 데이터를 화면(HTML)에 그리는 함수
function displayInsights(insights) {
    const listContainer = document.getElementById('archive-list');
    listContainer.innerHTML = ''; // 기존 내용을 비우기

    if (insights.length === 0) {
        listContainer.innerHTML = '<p style="padding: 20px;">아직 등록된 인사이트가 없습니다. 첫 기록을 남겨보세요!</p>';
        return;
    }

    insights.forEach(item => {
        // 카드 HTML 구조 생성
        const card = document.createElement('article');
        card.className = 'insight-card';

        // 썸네일이 없을 경우 기본 이미지 사용
        const thumbImg = item.thumbnail || 'https://via.placeholder.com/200x150?text=No+Image';

        card.innerHTML = `
            <img src="${thumbImg}" alt="thumbnail">
            <div class="card-body">
                <span class="date">${item.recorded_at}</span>
                <h3>${item.title || '제목 없음'}</h3>
                <p class="one-liner">"${item.one_liner}"</p>
                <div class="tag-group">${item.tags ? item.tags.map(t => `#${t}`).join(' ') : ''}</div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// '불러오기' 버튼 클릭 이벤트
document.getElementById('fetch-btn').onclick = async () => {
    const url = document.getElementById('url-input').value;
    const fetchBtn = document.getElementById('fetch-btn');
    const previewArea = document.getElementById('preview-area');

    if (!url) {
        alert('URL을 입력해주세요!');
        return;
    }

    fetchBtn.innerText = '불러오는 중...';
    fetchBtn.disabled = true;

    try {
        // Link Preview API 호출 (무료 데모 서버 사용)
        const response = await fetch(`https://api.linkpreview.net/?key=123456&q=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.title) {
            // 미리보기 영역 보이기 및 데이터 채우기
            previewArea.style.display = 'flex';
            document.getElementById('preview-img').src = data.image || 'https://via.placeholder.com/150';
            document.getElementById('title-input').value = data.title;
            
            // 전역 변수나 데이터 속성에 이미지 주소 저장 (나중에 DB 저장용)
            previewArea.dataset.imgUrl = data.image;
        } else {
            alert('정보를 가져올 수 없는 URL입니다. 직접 입력해주세요.');
            previewArea.style.display = 'flex'; // 입력창이라도 띄워줌
        }
    } catch (error) {
        console.error('URL 파싱 에러:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
        fetchBtn.innerText = '불러오기';
        fetchBtn.disabled = false;
    }
};

// '저장하기' 버튼 클릭 이벤트
document.getElementById('save-btn').onclick = async () => {
    // 1. 입력값 긁어오기
    const url = document.getElementById('url-input').value;
    const title = document.getElementById('title-input').value;
    const thumbnail = document.getElementById('preview-area').dataset.imgUrl || '';
    const one_liner = document.getElementById('oneliner-input').value;
    const my_thought = document.getElementById('thought-input').value;
    const recorded_at = document.getElementById('date-input').value;

    // 2. 유효성 검사 (필수 항목 확인)
    if (!url || !one_liner) {
        alert('URL과 한 줄 요약은 필수입니다!');
        return;
    }

    const saveBtn = document.getElementById('save-btn');
    saveBtn.innerText = '저장 중...';
    saveBtn.disabled = true;

    try {
        // 3. Supabase DB에 데이터 삽입 (Insert)
        // 주의: user_id는 일단 테스트를 위해 생략하거나 
        // Supabase에서 RLS 설정을 'Everyone'으로 잠시 풀었을 때 작동합니다.
        const { data, error } = await _supabase
            .from('posts')
            .insert([
                { 
                    url, 
                    title, 
                    thumbnail, 
                    one_liner, 
                    my_thought, 
                    recorded_at 
                }
            ]);

        if (error) throw error;

        // 4. 성공 시 처리
        alert('인사이트가 성공적으로 기록되었습니다! 🎉');
        
        // 입력창 비우고 모달 닫기
        document.getElementById('modal-overlay').style.display = 'none';
        resetModal();
        
        // 화면 리스트 새로고침
        fetchInsights();

    } catch (error) {
        console.error('저장 실패:', error);
        alert('저장에 실패했습니다: ' + error.message);
    } finally {
        saveBtn.innerText = '저장하기';
        saveBtn.disabled = false;
    }
};

// 모달 입력창 초기화 함수
function resetModal() {
    document.getElementById('url-input').value = '';
    document.getElementById('title-input').value = '';
    document.getElementById('oneliner-input').value = '';
    document.getElementById('thought-input').value = '';
    document.getElementById('preview-area').style.display = 'none';
    document.getElementById('preview-img').src = '';
}
