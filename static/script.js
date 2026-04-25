let data = [];
let currentIndex = 0;
let productList = [];

function upload() {
    const file = document.getElementById('fileInput').files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(res => {
        data = res;

        // 상품명 자동완성 리스트 생성
        productList = [...new Set(data.map(x => x["상품명"]))];

        render();
    });
}

function render() {
    if (data.length === 0) return;

    const item = data[currentIndex];

    document.getElementById('app').innerHTML = `
    <div class="card">

        <button onclick="download()">다운로드</button>
        <button onclick="share()">공유</button>

        <p><b>로케이션:</b> ${item["로케이션"]}</p>
        <p><b>상품명:</b> ${item["상품명"]}</p>
        <p><b>소비기한:</b> ${item["소비기한"]}</p>
        <p><b>로트번호:</b> ${item["로트번호"]}</p>
        <p><b>재고수량:</b> ${item["재고수량"]}</p>

        <input id="realQty" type="number" placeholder="실수량 입력" oninput="calcDiff()">
        <p>차이수량: <span id="diff">0</span></p>

        <button onclick="prev()">이전</button>
        <button onclick="same()">동일</button>
        <button onclick="next()">다음</button>

        <button onclick="addNew()">신규 재고등록</button>

        <div id="newItem"></div>
    </div>
    `;
}

function calcDiff() {
    const real = document.getElementById('realQty').value;
    const stock = data[currentIndex]["재고수량"] || 0;
    document.getElementById('diff').innerText = real - stock;
}

function prev() {
    if (currentIndex > 0) currentIndex--;
    render();
}

function next() {
    if (currentIndex < data.length - 1) currentIndex++;
    render();
}

function same() {
    document.getElementById('realQty').value = data[currentIndex]["재고수량"];
    calcDiff();
    next();
}

function addNew() {
    document.getElementById('newItem').innerHTML = `
        <h4>신규 재고 등록</h4>

        <input placeholder="로케이션" id="new_loc">
        
        <input placeholder="상품명" id="new_name" oninput="autoComplete()">
        <div id="suggest"></div>

        <input placeholder="소비기한" id="new_exp">
        <input placeholder="로트번호" id="new_lot">
        <input type="number" placeholder="재고수량" id="new_qty">

        <button onclick="saveNew()">추가</button>
    `;
}

function autoComplete() {
    const input = document.getElementById('new_name').value;

    const suggestions = productList
        .filter(p => p.includes(input))
        .slice(0, 5);

    document.getElementById('suggest').innerHTML =
        suggestions.map(s => `<div class="suggest-item" onclick="selectProduct('${s}')">${s}</div>`).join('');
}

function selectProduct(name) {
    document.getElementById('new_name').value = name;
    document.getElementById('suggest').innerHTML = '';
}

function saveNew() {
    const newItem = {
        "로케이션": document.getElementById('new_loc').value,
        "상품명": document.getElementById('new_name').value,
        "소비기한": document.getElementById('new_exp').value,
        "로트번호": document.getElementById('new_lot').value,
        "재고수량": Number(document.getElementById('new_qty').value || 0)
    };

    data.push(newItem);
    alert("추가 완료");
}

function download() {
    fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        window.location.href = res.download_url;
    });
}

function share() {
    fetch('/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        const link = window.location.origin + res.download_url;
        navigator.clipboard.writeText(link);
        alert("공유 링크 복사됨");
    });
}
