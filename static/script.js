function cleanNumber(value){
    return parseFloat(String(value).replace(/,/g,'')) || 0;
}

function render(){
    if(data.length === 0) return;

    document.getElementById('newItemBtn').style.display = 'block';

    localStorage.setItem("currentIndex", currentIndex);

    let item = data[currentIndex];
    let stock = cleanNumber(item["재고수량"]);

    let percent = Math.round(((currentIndex + 1) / data.length) * 100);

    document.getElementById('app').innerHTML = `
    <div class="card">

        <p><b>진행율:</b> ${currentIndex + 1} / ${data.length} (${percent}%)</p>

        <div style="background:#ddd;height:10px;border-radius:5px;">
            <div style="width:${percent}%;background:#4caf50;height:10px;border-radius:5px;"></div>
        </div>

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
    } else {
        alert("마지막 항목입니다");
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

/* ✅ 다운로드 (완전 수정) */
function download(){
    fetch('/save',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(res=>{
        window.location = "/download/" + res.file_id;
    });
}

/* ✅ 공유 (완전 수정) */
function share(){
    fetch('/save',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(res=>{
        const url = location.origin + "/share/" + res.file_id;

        if(navigator.clipboard){
            navigator.clipboard.writeText(url)
                .then(()=> alert("공유 링크 복사됨"))
                .catch(()=> fallbackCopy(url));
        } else {
            fallbackCopy(url);
        }
    });
}

function fallbackCopy(text){
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    alert("공유 링크 복사됨");
}

/* 신규 재고 */
function addNewItem(){
    let location = document.getElementById('new_location').value;
    let name = document.getElementById('new_name').value;
    let exp = document.getElementById('new_exp').value;
    let lot = document.getElementById('new_lot').value;
    let qty = document.getElementById('new_qty').value;

    if(!location || !name || !qty){
        alert("필수값 입력");
        return;
    }

    let stock = cleanNumber(qty);

    data.push({
        "로케이션": location,
        "상품명": name,
        "소비기한": exp,
        "로트번호": lot,
        "재고수량": stock,
        "실수량": stock,
        "차이수량": 0,
        "신규": true
    });

    localStorage.setItem("inventoryData", JSON.stringify(data));

    document.getElementById('newItemBox').style.display = 'none';

    document.getElementById('new_location').value = "";
    document.getElementById('new_name').value = "";
    document.getElementById('new_exp').value = "";
    document.getElementById('new_lot').value = "";
    document.getElementById('new_qty').value = "";

    if(!productList.includes(name)){
        productList.push(name);
    }

    render();
}
