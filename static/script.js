function cleanNumber(value){
    return parseFloat(String(value).replace(/,/g,'')) || 0;
}

function render(){
    if(data.length === 0) return;

    document.getElementById('newItemBtn').style.display = 'block';

    localStorage.setItem("currentIndex", currentIndex);

    let item = data[currentIndex];
    let stock = cleanNumber(item["재고수량"]);

    document.getElementById('app').innerHTML = `
    <div class="card">
        <p><b>로케이션:</b> ${item["로케이션"] || ""}</p>
        <p><b>상품명:</b> ${item["상품명"] || ""}</p>
        <p><b>소비기한:</b> ${item["소비기한"] || ""}</p>
        <p><b>로트번호:</b> ${item["로트번호"] || ""}</p>
        <p><b>재고수량:</b> ${stock}</p>

        <input id="real_qty" placeholder="실수량"
            value="${item["실수량"] ?? ""}"
            inputmode="numeric"
            oninput="updateDiff()"
            onkeydown="enterNext(event)">

        <p>차이수량: <span id="diff">0</span></p>

        <div class="nav-buttons">
            <button onclick="prev()">이전</button>
            <button onclick="same()">동일</button>
            <button onclick="next()">다음</button>
        </div>

        <button onclick="download()">다운로드</button>
        <button onclick="share()">공유</button>
    </div>
    `;

    updateDiff();
}

function updateDiff(){
    let input = document.getElementById('real_qty');
    if(!input) return;

    let real = cleanNumber(input.value);
    let stock = cleanNumber(data[currentIndex]["재고수량"]);
    let diff = real - stock;

    document.getElementById('diff').innerText = diff;

    data[currentIndex]["실수량"] = real;
    data[currentIndex]["차이수량"] = diff;

    localStorage.setItem("inventoryData", JSON.stringify(data));
}

function enterNext(e){
    if(e.key === "Enter"){
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
    let stock = cleanNumber(data[currentIndex]["재고수량"]);

    data[currentIndex]["실수량"] = stock;
    data[currentIndex]["차이수량"] = 0;

    localStorage.setItem("inventoryData", JSON.stringify(data));

    next();
}

function download(){
    fetch('/save',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(res=>{
        window.location = res.download_url;
    });
}

function share(){
    fetch('/save',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(res=>{
        const url = location.origin + res.download_url;
        navigator.clipboard.writeText(url);
        alert("다운로드 링크 복사됨");
    });
}
