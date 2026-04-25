function render() {
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

        <input id="realQty"
            type="number"
            inputmode="numeric"
            value="${item["실수량"] || ""}"
            placeholder="실수량 입력"
            oninput="updateQty()"
            onkeydown="enterMove(event)">

        <p>차이수량: <span id="diff">${item["차이수량"] || 0}</span></p>

        <div class="nav-buttons">
            <button onclick="prev()">이전</button>
            <button onclick="same()">동일</button>
            <button onclick="next()">다음</button>
        </div>

        <button onclick="addNew()">신규 재고등록</button>
        <div id="newItem"></div>

    </div>
    `;
}

function updateQty() {
    const val = Number(document.getElementById('realQty').value || 0);
    const stock = Number(data[currentIndex]["재고수량"] || 0);

    data[currentIndex]["실수량"] = val;
    data[currentIndex]["차이수량"] = val - stock;

    document.getElementById('diff').innerText = val - stock;
}

function enterMove(e){
    if(e.key==="Enter"){
        e.preventDefault();
        next();
    }
}

function next(){
    if(currentIndex < data.length - 1){
        currentIndex++;
        render();
    }
}

function prev(){
    if(currentIndex > 0){
        currentIndex--;
        render();
    }
}

function same(){
    let stock = data[currentIndex]["재고수량"];
    data[currentIndex]["실수량"] = stock;
    data[currentIndex]["차이수량"] = 0;
    next();
}

function addNew() {
    document.getElementById('newItem').innerHTML = `
        <h4>신규 재고 등록</h4>
        <input placeholder="로케이션" id="new_loc">
        <input placeholder="상품명" id="new_name">
        <input placeholder="소비기한" id="new_exp">
        <input placeholder="로트번호" id="new_lot">
        <input type="number" placeholder="재고수량" id="new_qty">
        <button onclick="saveNew()">추가</button>
    `;
}

function saveNew() {
    const newItem = {
        "로케이션": document.getElementById('new_loc').value,
        "상품명": document.getElementById('new_name').value,
        "소비기한": document.getElementById('new_exp').value,
        "로트번호": document.getElementById('new_lot').value,
        "재고수량": Number(document.getElementById('new_qty').value || 0),
        "실수량": "",
        "차이수량": ""
    };

    data.push(newItem);
    alert("추가 완료");
}

function download(){
    fetch('/save',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(res=>location.href=res.download_url);
}

function share(){
    fetch('/save',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(res=>{
        navigator.clipboard.writeText(location.origin+res.download_url);
        alert("링크 복사됨");
    });
}
