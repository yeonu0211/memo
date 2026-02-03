// 1. Supabase 접속 설정
const SUPABASE_URL = 'https://nwyucikmofvsoankgfhy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53eXVjaWttb2Z2c29hbmtnZmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTYwMzgsImV4cCI6MjA4NTY5MjAzOH0.stW6jDfJUm-Out9E3r3wjMmWsHXtfFVPb4AdM8iKPR0';
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

window.onload = () => {
    // 초기 데이터 로드 (인트로 화면 뒤에서 미리 로딩)
    fetchInsights();

    // --- [섹션 1: 인트로 책 애니메이션] ---
    const enterBtn = document.getElementById('enter-btn');
    const book = document.getElementById('main-book');
    const introScreen = document.getElementById('intro-screen');
    const mainContent = document.getElementById('main-content');

    if (enterBtn && book) {
        enterBtn.onclick = () => {
            console.log("책 열기 버튼 클릭됨");
            book.classList.add('open');
            enterBtn.style.opacity = '0';
            enterBtn.style.pointerEvents = 'none';

            setTimeout(() => {
                introScreen.style.opacity = '0';
                setTimeout(() => {
                    introScreen.style.display = 'none';
                    mainContent.style.display = 'block';
                    fetchInsights(); // 레이아웃 재정렬을 위해 재호출
                }, 1000);
            }, 1500);
        };
    }

    // --- [섹션 2: 모달 제어] ---
    const modal = document.getElementById('modal-overlay');
    const addBtn = document.getElementById('add-btn');
    const closeBtn = document.getElementById('close-modal');
    const dateInput = document.getElementById('date-input');

    if (dateInput) {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset).toISOString().split('T')[0];
        dateInput.value = localDate;
    }

    if (addBtn) addBtn.onclick = () => { modal.style.display = 'flex'; };
    if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target == modal) { modal.style.display = 'none'; }
    };

    // --- [섹션 3: 불러오기 버튼 로직] ---
    const fetchBtn = document.getElementById('fetch-btn');
    if (fetchBtn) {
        fetchBtn.onclick = async () => {
            const url = document.getElementById('url-input').value;
            const previewArea = document.getElementById('preview-area');
            if (!url) { alert('URL을 입력해주세요!'); return; }

            fetchBtn.innerText = '불러오는 중...';
            fetchBtn.disabled = true;

            try {
                const response = await fetch(`https://api.linkpreview.net/?key=123456&q=${encodeURIComponent(url)}`);
                const data = await response.json();
                if (data.title) {
                    previewArea.style.display = 'flex';
                    document.getElementById('preview-img').src = data.image || 'https://via.placeholder.com/150';
                    document.getElementById('title-input').value = data.title;
                    previewArea.dataset.imgUrl = data.image;
                } else {
                    alert('정보를 가져올 수 없어 직접 입력창을 띄웁니다.');
                    previewArea.style.display = 'flex';
                }
            } catch (error) {
                alert('데이터를 불러오는 중 오류가 발생했습니다.');
            } finally {
                fetchBtn.innerText = '불러오기';
                fetchBtn.disabled = false;
            }
        };
    }

    // --- [섹션 4: 저장하기 버튼 로직] ---
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const url = document.getElementById('url-input').value;
            const title = document.getElementById('title-input').value;
            const thumbnail = document.getElementById('preview-area').dataset.imgUrl || '';
            const one_liner = document.getElementById('oneliner-input').value;
            const my_thought = document.getElementById('thought-input').value;
            const recorded_at = document.getElementById('date-input').value;

            if (!url || !one_liner) { alert('URL과 한 줄 요약은 필수입니다!'); return; }

            saveBtn.innerText = '저장 중...';
            saveBtn.disabled = true;

            try {
                const { error } = await _supabase.from('posts').insert([{ url, title, thumbnail, one_liner, my_thought, recorded_at }]);
                if (error) throw error;
                alert('인사이트가 성공적으로 기록되었습니다! 🎉');
                modal.style.display = 'none';
                resetModal();
                fetchInsights();
            } catch (error) {
                alert('저장에 실패했습니다: ' + error.message);
            } finally {
                saveBtn.innerText = '저장하기';
                saveBtn.disabled = false;
            }
        };
    }
};

// 도움 함수들
async function fetchInsights() {
    const { data, error } = await _supabase.from('posts').select('*').order('recorded_at', { ascending: false });
    if (!error) displayInsights(data);
}

function displayInsights(insights) {
    const listContainer = document.getElementById('archive-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    if (insights.length === 0) {
        listContainer.innerHTML = '<p style="padding: 20px;">아직 등록된 인사이트가 없습니다.</p>';
        return;
    }
    insights.forEach(item => {
        const card = document.createElement('article');
        card.className = 'insight-card';
        const thumbImg = item.thumbnail || 'https://via.placeholder.com/200x150?text=No+Image';
        card.innerHTML = `
            <img src="${thumbImg}" alt="thumbnail">
            <div class="card-body">
                <span class="date">${item.recorded_at}</span>
                <h3>${item.title || '제목 없음'}</h3>
                <p class="one-liner">"${item.one_liner}"</p>
                <div class="tag-group">${item.tags ? item.tags.map(t => `#${t}`).join(' ') : ''}</div>
            </div>`;
        listContainer.appendChild(card);
    });
}

function resetModal() {
    document.getElementById('url-input').value = '';
    document.getElementById('title-input').value = '';
    document.getElementById('oneliner-input').value = '';
    document.getElementById('thought-input').value = '';
    const preview = document.getElementById('preview-area');
    preview.style.display = 'none';
    delete preview.dataset.imgUrl;
}
