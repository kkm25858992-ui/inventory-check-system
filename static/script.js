let data = [];
let currentIndex = 0;

function upload() {
    const file = document.getElementById('fileInput').files[0];

    if (!file) {
        alert("파일 선택하세요");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error("업로드 실패");
        return res.json();
    })
    .then(res => {
        data = res.map(x => ({
            ...x,
            "실수량": "",
            "차이수량": ""
        }));

        document.getElementById('uploadBox').style.display = 'none';
        render();
    })
    .catch(() => alert("업로드 실패 (모바일 파일 확인)"));
}

function render() {
    const item = data[currentIndex];

    document.getElementById('app').innerHTML = `
    <div class="card">

        <button onclick="download()">다운로드</button>
        <button onclick="share()">공유</button>

        <p>${item["로케이션"]}</p>
        <p>${item["상품명"]}</p>

        <input id="realQty"
            type="number"
            inputmode="numeric"
            value="${item["실수량"] || ""}"
            oninput="updateQty()"
            onkeydown="enterMove(event)">

        <p id="diff">${item["차이수량"] || 0}</p>

        <div class="nav-buttons">
            <button onclick="prev()">이전</button>
            <button onclick="same()">동일</button>
            <button onclick="next()">다음</button>
        </div>
    </div>
    `;

    setTimeout(()=>document.getElementById('realQty').focus(),50);
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

function next(){ if(currentIndex<data.length-1){currentIndex++; render();}}
function prev(){ if(currentIndex>0){currentIndex--; render();}}

function same(){
    let stock = data[currentIndex]["재고수량"];
    data[currentIndex]["실수량"]=stock;
    data[currentIndex]["차이수량"]=0;
    next();
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
