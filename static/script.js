// 숫자 정리
function cleanNumber(value){
    return parseFloat(String(value).replace(/,/g,'')) || 0;
}

// 화면 렌더링
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

            <input id="real_qty"
                placeholder="실수량"
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

// 차이 계산
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

// 엔터 → 다음
function enterNext(e){
    if(e.key === "Enter"){
        e.preventDefault();
        next();
    }
}

// 다음
function next(){
    if(currentIndex < data.length - 1){
        currentIndex++;
        render();
    }
}

// 이전
function prev(){
    if(currentIndex > 0){
        currentIndex--;
        render();
    }
}

// 동일 처리
function same(){
    let stock = cleanNumber(data[currentIndex]["재고수량"]);

    data[currentIndex]["실수량"] = stock;
    data[currentIndex]["차이수량"] = 0;

    localStorage.setItem("inventoryData", JSON.stringify(data));

    next();
}

// 다운로드
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

// 공유
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

// 🔥 신규 재고 추가 (완성)
function addNewItem(){

    let location = document.getElementById('new_location').value.trim();
    let name = document.getElementById('new_name').value.trim();
    let exp = document.getElementById('new_exp').value.trim();
    let lot = document.getElementById('new_lot').value.trim();
    let qty = document.getElementById('new_qty').value.trim();

    if(!location || !name || !qty){
        alert("필수값 입력");
        return;
    }

    let stock = cleanNumber(qty);

    let newItem = {
        "로케이션": location,
        "상품명": name,
        "소비기한": exp,
        "로트번호": lot,
        "재고수량": stock,
        "실수량": stock,
        "차이수량": 0,
        "신규": true   // 🔥 핵심 (시트2 분리용)
    };

    data.push(newItem);

    localStorage.setItem("inventoryData", JSON.stringify(data));

    // 입력 초기화
    document.getElementById('newItemBox').style.display = 'none';
    document.getElementById('new_location').value = "";
    document.getElementById('new_name').value = "";
    document.getElementById('new_exp').value = "";
    document.getElementById('new_lot').value = "";
    document.getElementById('new_qty').value = "";

    // 상품 리스트 업데이트
    if(!productList.includes(name)){
        productList.push(name);
    }

    // 🔥 바로 신규 항목으로 이동 (사용성 개선)
    currentIndex = data.length - 1;

    render();
}
