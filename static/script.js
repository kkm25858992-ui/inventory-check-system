let data = [];
let currentIndex = 0;

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
        render();
    });
}

function render() {
    const item = data[currentIndex];

    document.getElementById('app').innerHTML = `
        <div>
            <button onclick="download()">다운로드</button>
            <button onclick="share()">공유</button>

            <p>로케이션: ${item.location}</p>
            <p>상품명: ${item.name}</p>
            <p>소비기한: ${item.exp}</p>
            <p>로트넘버: ${item.lot}</p>
            <p>재고수량: ${item.qty}</p>

            <input id="realQty" placeholder="실수량 입력" oninput="calcDiff()">
            <p>차이수량: <span id="diff">0</span></p>

            <button onclick="prev()">이전</button>
            <button onclick="same()">동일</button>
            <button onclick="next()">다음</button>
        </div>
    `;
}

function calcDiff() {
    const real = document.getElementById('realQty').value;
    const stock = data[currentIndex].qty;
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
    document.getElementById('realQty').value = data[currentIndex].qty;
    calcDiff();
    next();
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
        navigator.clipboard.writeText(window.location.origin + res.download_url);
        alert("링크 복사됨");
    });
}