<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ourbox 오산센터 재고조사</title>

<style>
body { font-family:sans-serif; padding:20px; background:#f0f9f4; }
.header { text-align:center; font-size:26px; font-weight:bold; color:#2e7d32; }

.card { background:white; padding:20px; border-radius:12px; margin-top:10px; }

input {
    width:100%;
    padding:16px;
    font-size:20px;
    margin-top:8px;
}

button {
    width:100%;
    padding:16px;
    font-size:18px;
    margin-top:8px;
    background:#66bb6a;
    color:white;
    border:none;
}

.nav-buttons {
    display:flex;
    gap:6px;
}

.nav-buttons button {
    flex:1;
}

#newItemBox {
    display:none;
    background:white;
    padding:15px;
    border-radius:12px;
    margin-top:10px;
}

.autocomplete-items {
    border:1px solid #ddd;
    max-height:150px;
    overflow-y:auto;
    background:white;
}
.autocomplete-items div {
    padding:10px;
    cursor:pointer;
}
.autocomplete-items div:hover {
    background:#e0f2f1;
}
</style>
</head>

<body>

<div class="header">ourbox 오산센터 재고조사</div>

<form id="uploadForm" action="/upload" method="post" enctype="multipart/form-data">
    <input type="file" name="file">
    <button type="submit">엑셀 업로드</button>
</form>

<div id="app"></div>

<button id="newItemBtn" onclick="toggleNewItem()" style="display:none;">
    신규 재고등록
</button>

<div id="newItemBox">
    <input id="new_location" placeholder="로케이션">
    <input id="new_name" placeholder="상품명">
    <div id="autocomplete-box"></div>

    <input id="new_exp" placeholder="소비기한">
    <input id="new_lot" placeholder="로트번호">
    <input id="new_qty" placeholder="재고수량" inputmode="numeric">

    <button onclick="addNewItem()">확인</button>
    <button onclick="toggleNewItem()">취소</button>
</div>

<script>
let data = {{ data|tojson | safe }};
let currentIndex = 0;
let productList = [];

// 🔥 디버깅
console.log("초기 data:", data);

// 🔥 이어하기 + 충돌 방지
window.onload = function(){

    let saved = localStorage.getItem("inventoryData");

    // 🔥 서버 데이터 없을 때만 이어하기 적용
    if(saved && data.length === 0){
        if(confirm("이전에 작업한 데이터가 있습니다.\n이어하시겠습니까?")){
            data = JSON.parse(saved);

            let savedIndex = localStorage.getItem("currentIndex");
            if(savedIndex){
                currentIndex = Number(savedIndex);
            }
        }else{
            localStorage.removeItem("inventoryData");
            localStorage.removeItem("currentIndex");
        }
    }

    // 🔥 데이터 있으면 무조건 실행
    if(data && data.length > 0){
        document.getElementById('uploadForm').style.display = 'none';
        document.getElementById('newItemBtn').style.display = 'block';

        initProductList();
        render();
    }
};

// 상품 리스트
function initProductList(){
    productList = [...new Set(data.map(d => d["상품명"]))];
}

// 자동완성
function autocomplete(){
    const input = document.getElementById("new_name");
    const box = document.getElementById("autocomplete-box");

    input.addEventListener("input", function(){
        box.innerHTML = "";

        let val = this.value.toLowerCase();

        productList.forEach(item => {
            if(item.toLowerCase().includes(val)){
                let div = document.createElement("div");
                div.innerText = item;

                div.onclick = function(){
                    input.value = item;
                    box.innerHTML = "";
                };

                box.appendChild(div);
            }
        });
    });
}

// 신규 UI
function toggleNewItem(){
    const box = document.getElementById('newItemBox');

    if(box.style.display === 'none'){
        box.style.display = 'block';
        autocomplete();
    }else{
        box.style.display = 'none';
    }
}
</script>

<script src="/static/script.js"></script>

</body>
</html>
