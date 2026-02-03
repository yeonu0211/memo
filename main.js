// 1. Supabase 접속 설정
const SUPABASE_URL = 'https://nwyucikmofvsoankgfhy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eXVjaWttb2Z2c29hbmtnZmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTYwMzgsImV4cCI6MjA4NTY5MjAzOH0.stW6jDfJUm-Out9E3r3wjMmWsHXtfFVPb4AdM8iKPR0';
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. 페이지가 로드되면 실행
window.onload = () => {
    // 기존 기능: 데이터 불러오기
    fetchInsights();

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
