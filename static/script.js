/* =========================================================
   전역 변수
========================================================= */

let currentStep = "rack";

let currentRack = "";

let currentProduct = null;

let mappingData =
    Array.isArray(mapping)
        ? mapping
        : [];


/* =========================================================
   숫자 정리
========================================================= */

function cleanNumber(value){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){
        return 0;
    }

    let number =
        parseFloat(
            String(value)
                .replace(/,/g, "")
                .trim()
        );

    return isNaN(number)
        ? 0
        : number;
}


/* =========================================================
   문자열
========================================================= */

function cleanString(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }

    return String(value).trim();
}


/* =========================================================
   localStorage 저장
========================================================= */

function saveLocal(){

    localStorage.setItem(
        "inventoryData",
        JSON.stringify(data)
    );

    localStorage.setItem(
        "mappingData",
        JSON.stringify(mappingData)
    );

}


/* =========================================================
   메인 화면
========================================================= */

function render(){

    let app =
        document.getElementById(
            "app"
        );

    if(!app){
        return;
    }


    let percent = 0;

    if(data.length > 0){

        percent =
            Math.round(
                (
                    data.length
                    /
                    Math.max(
                        data.length,
                        1
                    )
                ) * 100
            );

    }


    app.innerHTML = `

        <div class="card">

            <div class="step-title">
                재고조사
            </div>


            <div class="progress-text">

                등록 건수 :
                ${data.length}

            </div>


            <div class="progress-bg">

                <div
                    class="progress-bar"
                    style="width:${percent}%"
                ></div>

            </div>


            <div id="scanArea">

            </div>

        </div>

    `;


    renderRackStep();

}


/* =========================================================
   1단계
   랙 바코드
========================================================= */

function renderRackStep(){

    currentStep = "rack";

    currentRack = "";

    currentProduct = null;


    let area =
        document.getElementById(
            "scanArea"
        );


    area.innerHTML = `

        <div class="step-title">

            1. 랙 바코드 스캔

        </div>


        <input
            id="rackBarcode"
            placeholder="랙 바코드를 스캔하세요"
            autocomplete="off"
            inputmode="text"
        >


        <button
            class="product-button"
            onclick="confirmRack()"
        >
            랙 확인
        </button>

    `;


    let input =
        document.getElementById(
            "rackBarcode"
        );


    input.focus();


    input.addEventListener(
        "keydown",
        function(e){

            if(e.key === "Enter"){

                e.preventDefault();

                confirmRack();

            }

        }
    );

}


/* =========================================================
   랙 확인
========================================================= */

function confirmRack(){

    let input =
        document.getElementById(
            "rackBarcode"
        );


    if(!input){
        return;
    }


    let rack =
        cleanString(
            input.value
        );


    if(!rack){

        alert(
            "랙 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    currentRack = rack;


    renderProductStep();

}


/* =========================================================
   2단계
   제품 바코드
========================================================= */

function renderProductStep(){

    currentStep = "product";


    let area =
        document.getElementById(
            "scanArea"
        );


    area.innerHTML = `

        <div class="step-title">

            2. 제품 바코드 스캔

        </div>


        <div class="info-box">

            <div class="info-row">

                <span class="info-label">
                    현재 랙
                </span>

                <span class="info-value">
                    ${escapeHtml(currentRack)}
                </span>

            </div>

        </div>


        <input
            id="productBarcode"
            placeholder="제품 바코드를 스캔하세요"
            autocomplete="off"
            inputmode="text"
        >


        <button
            class="product-button"
            onclick="confirmProduct()"
        >
            제품 확인
        </button>

    `;


    let input =
        document.getElementById(
            "productBarcode"
        );


    input.focus();


    input.addEventListener(
        "keydown",
        function(e){

            if(e.key === "Enter"){

                e.preventDefault();

                confirmProduct();

            }

        }
    );

}


/* =========================================================
   제품 확인
========================================================= */

function confirmProduct(){

    let input =
        document.getElementById(
            "productBarcode"
        );


    if(!input){
        return;
    }


    let barcode =
        cleanString(
            input.value
        );


    if(!barcode){

        alert(
            "제품 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    let found =
        findProduct(
            barcode
        );


    if(!found){

        alert(
            "시트2에서 해당 바코드를 찾을 수 없습니다."
        );

        input.value = "";

        input.focus();

        return;

    }


    currentProduct = {

        바코드: barcode,

        화주사:
            cleanString(
                found.화주사
            ),

        입수량:
            cleanNumber(
                found.입수량
            ),

        상품명:
            cleanString(
                found.상품명
            )

    };


    renderExpStep();

}


/* =========================================================
   바코드 검색
========================================================= */

function findProduct(barcode){

    let target =
        cleanString(
            barcode
        );


    for(
        let i = 0;
        i < mappingData.length;
        i++
    ){

        let item =
            mappingData[i];


        let itemBarcode =
            cleanString(
                item.바코드
            );


        if(
            itemBarcode === target
        ){

            return item;

        }

    }


    return null;

}


/* =========================================================
   3단계
   소비기한
========================================================= */

function renderExpStep(){

    currentStep = "exp";


    let area =
        document.getElementById(
            "scanArea"
        );


    area.innerHTML = `

        <div class="step-title">

            3. 소비기한 입력

        </div>


        <div class="info-box">

            <div class="info-row">

                <span class="info-label">
                    랙
                </span>

                <span class="info-value">
                    ${escapeHtml(currentRack)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    상품명
                </span>

                <span class="info-value">
                    ${escapeHtml(currentProduct.상품명)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    화주사
                </span>

                <span class="info-value">
                    ${escapeHtml(currentProduct.화주사)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    입수량
                </span>

                <span class="info-value">
                    ${formatNumber(currentProduct.입수량)}
                </span>

            </div>

        </div>


        <input
            id="expiryDate"
            placeholder="YYYY-MM-DD"
            maxlength="10"
            inputmode="numeric"
            autocomplete="off"
        >

    `;


    let input =
        document.getElementById(
            "expiryDate"
        );


    input.focus();


    input.addEventListener(
        "input",
        handleDateInput
    );


    input.addEventListener(
        "keydown",
        function(e){

            if(e.key === "Enter"){

                e.preventDefault();

                if(
                    input.value.length >= 8
                ){

                    renderBoxStep();

                }

            }

        }
    );

}


/* =========================================================
   소비기한 자동 이동
========================================================= */

function handleDateInput(){

    let input =
        document.getElementById(
            "expiryDate"
        );


    if(!input){
        return;
    }


    let value =
        input.value
            .replace(/\D/g, "")
            .substring(0, 8);


    let result = "";


    if(value.length <= 4){

        result = value;

    }
    else if(value.length <= 6){

        result =
            value.substring(0, 4)
            +
            "-"
            +
            value.substring(4);

    }
    else {

        result =
            value.substring(0, 4)
            +
            "-"
            +
            value.substring(4, 6)
            +
            "-"
            +
            value.substring(6, 8);

    }


    input.value = result;


    if(value.length === 8){

        setTimeout(
            function(){

                renderBoxStep();

            },
            100
        );

    }

}


/* =========================================================
   4단계
   박스수
========================================================= */

function renderBoxStep(){

    currentStep = "box";


    let area =
        document.getElementById(
            "scanArea"
        );


    let existing =
        findCurrentInput();


    area.innerHTML = `

        <div class="step-title">

            4. 박스수 입력

        </div>


        <div class="info-box">

            <div class="info-row">

                <span class="info-label">
                    상품명
                </span>

                <span class="info-value">
                    ${escapeHtml(currentProduct.상품명)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    입수량
                </span>

                <span class="info-value">
                    ${formatNumber(currentProduct.입수량)}
                </span>

            </div>

        </div>


        <input
            id="boxQty"
            placeholder="박스수"
            inputmode="numeric"
            autocomplete="off"
        >


        <div class="total-box">

            <div class="total-title">
                현재 총수량
            </div>

            <div
                id="totalQty"
                class="total-value"
            >
                0
            </div>

        </div>

    `;


    let input =
        document.getElementById(
            "boxQty"
        );


    input.focus();


    input.addEventListener(
        "input",
        updateTotal
    );


    input.addEventListener(
        "keydown",
        function(e){

            if(e.key === "Enter"){

                e.preventDefault();

                renderEachStep();

            }

        }
    );

}


/* =========================================================
   5단계
   낱개수량
========================================================= */

function renderEachStep(){

    currentStep = "each";


    let area =
        document.getElementById(
            "scanArea"
        );


    let boxInput =
        document.getElementById(
            "boxQty"
        );


    let boxQty =
        boxInput
            ? cleanNumber(
                boxInput.value
            )
            : 0;


    area.innerHTML = `

        <div class="step-title">

            5. 낱개수량 입력

        </div>


        <div class="info-box">

            <div class="info-row">

                <span class="info-label">
                    상품명
                </span>

                <span class="info-value">
                    ${escapeHtml(currentProduct.상품명)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    입수량
                </span>

                <span class="info-value">
                    ${formatNumber(currentProduct.입수량)}
                </span>

            </div>


            <div class="info-row">

                <span class="info-label">
                    박스수
                </span>

                <span class="info-value">
                    ${formatNumber(boxQty)}
                </span>

            </div>

        </div>


        <input
            id="eachQty"
            placeholder="낱개수량"
            inputmode="numeric"
            autocomplete="off"
        >


        <div class="total-box">

            <div class="total-title">
                최종 수량
            </div>

            <div
                id="finalTotalQty"
                class="total-value"
            >
                ${formatNumber(
                    currentProduct.입수량
                    * boxQty
                )}
            </div>

        </div>


        <button
            onclick="saveCurrentInventory()"
        >
            수량 저장
        </button>

    `;


    let input =
        document.getElementById(
            "eachQty"
        );


    input.focus();


    input.addEventListener(
        "input",
        updateFinalTotal
    );


    input.addEventListener(
        "keydown",
        function(e){

            if(e.key === "Enter"){

                e.preventDefault();

                saveCurrentInventory();

            }

        }
    );

}


/* =========================================================
   박스 입력 중 총수량
========================================================= */

function updateTotal(){

    let boxInput =
        document.getElementById(
            "boxQty"
        );


    if(!boxInput){
        return;
    }


    let boxQty =
        cleanNumber(
            boxInput.value
        );


    let unitQty =
        cleanNumber(
            currentProduct.입수량
        );


    let total =
        unitQty *
        boxQty;


    let output =
        document.getElementById(
            "totalQty"
        );


    if(output){

        output.innerText =
            formatNumber(total);

    }

}


/* =========================================================
   최종 수량 계산
========================================================= */

function updateFinalTotal(){

    let boxInput =
        document.getElementById(
            "boxQty"
        );


    let eachInput =
        document.getElementById(
            "eachQty"
        );


    let boxQty =
        boxInput
            ? cleanNumber(
                boxInput.value
            )
            : 0;


    let eachQty =
        eachInput
            ? cleanNumber(
                eachInput.value
            )
            : 0;


    let unitQty =
        cleanNumber(
            currentProduct.입수량
        );


    let total =
        (
            unitQty *
            boxQty
        )
        +
        eachQty;


    let output =
        document.getElementById(
            "finalTotalQty"
        );


    if(output){

        output.innerText =
            formatNumber(total);

    }

}


/* =========================================================
   현재 재고 저장
========================================================= */

function saveCurrentInventory(){

    if(!currentProduct){

        alert(
            "제품 정보가 없습니다."
        );

        return;

    }


    let expiryInput =
        document.getElementById(
            "expiryDate"
        );


    /*
       소비기한은 이전 단계 화면에서
       이미 입력했기 때문에 화면이 변경된 경우
       별도로 저장하기 위해 전역변수 사용
    */

    let expiry =
        window.currentExpiry || "";


    if(
        expiryInput
    ){

        expiry =
            expiryInput.value;

        window.currentExpiry =
            expiry;

    }


    /*
       소비기한 단계에서 넘어올 때
       값을 유지하기 위한 처리
    */

    if(
        !window.currentExpiry
    ){

        let savedExpiry =
            localStorage.getItem(
                "currentExpiry"
            );

        if(savedExpiry){

            window.currentExpiry =
                savedExpiry;

        }

    }


    expiry =
        window.currentExpiry || "";


    let boxInput =
        document.getElementById(
            "boxQty"
        );


    let eachInput =
        document.getElementById(
            "eachQty"
        );


    let boxQty =
        boxInput
            ? cleanNumber(
                boxInput.value
            )
            : 0;


    let eachQty =
        eachInput
            ? cleanNumber(
                eachInput.value
            )
            : 0;


    let unitQty =
        cleanNumber(
            currentProduct.입수량
        );


    let total =
        (
            unitQty *
            boxQty
        )
        +
        eachQty;


    data.push({

        "바코드":
            currentProduct.바코드,

        "랙":
            currentRack,

        "소비기한":
            expiry,

        "수량":
            total,

        "상품명":
            currentProduct.상품명,

        "화주사":
            currentProduct.화주사

    });


    saveLocal();


    alert(
        "수량이 저장되었습니다."
    );


    /*
       다음 입력은 다시
       랙 바코드부터 시작
    */

    currentRack = "";

    currentProduct = null;

    window.currentExpiry = "";

    localStorage.removeItem(
        "currentExpiry"
    );


    render();

}


/* =========================================================
   소비기한 단계 진입 전에 값 저장
========================================================= */

document.addEventListener(
    "input",
    function(e){

        if(
            e.target &&
            e.target.id ===
            "expiryDate"
        ){

            window.currentExpiry =
                e.target.value;

            localStorage.setItem(
                "currentExpiry",
                e.target.value
            );

        }

    }
);


/* =========================================================
   다운로드
========================================================= */

function download(){

    if(data.length === 0){

        alert(
            "저장된 재고조사 데이터가 없습니다."
        );

        return;

    }


    fetch(
        "/save",
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify({

                    inventory:
                        data,

                    mapping:
                        mappingData

                })

        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        result => {

            if(result.error){

                alert(
                    result.error
                );

                return;

            }


            window.location =
                "/download/" +
                result.file_id;

        }
    )

    .catch(
        error => {

            console.error(error);

            alert(
                "다운로드 중 오류가 발생했습니다."
            );

        }
    );

}


/* =========================================================
   공유
========================================================= */

function share(){

    if(data.length === 0){

        alert(
            "저장된 재고조사 데이터가 없습니다."
        );

        return;

    }


    fetch(
        "/save",
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify({

                    inventory:
                        data,

                    mapping:
                        mappingData

                })

        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        result => {

            if(result.error){

                alert(
                    result.error
                );

                return;

            }


            let url =
                location.origin +
                "/share/" +
                result.file_id;


            if(
                navigator.share
            ){

                navigator.share({

                    title:
                        "재고조사 결과",

                    text:
                        "재고조사 엑셀 다운로드",

                    url:
                        url

                })
                .catch(
                    () => {}
                );

                return;

            }


            if(
                navigator.clipboard
            ){

                navigator.clipboard
                    .writeText(url)

                    .then(
                        () => {

                            alert(
                                "공유 링크가 복사되었습니다."
                            );

                        }
                    )

                    .catch(
                        () => {

                            showManualCopy(
                                url
                            );

                        }
                    );

            }
            else {

                showManualCopy(
                    url
                );

            }

        }
    )

    .catch(
        error => {

            console.error(error);

            alert(
                "공유 링크 생성 실패"
            );

        }
    );

}


/* =========================================================
   수동 복사
========================================================= */

function showManualCopy(url){

    let app =
        document.getElementById(
            "app"
        );


    let div =
        document.createElement(
            "div"
        );


    div.className =
        "card";


    div.innerHTML = `

        <p>
            <b>
                공유 링크
            </b>
        </p>


        <input
            value="${escapeHtml(url)}"
            readonly
        >

    `;


    app.prepend(div);

}


/* =========================================================
   QR 생성
========================================================= */

function createQR(){

    if(data.length === 0){

        alert(
            "저장된 데이터가 없습니다."
        );

        return;

    }


    fetch(
        "/save",
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify({

                    inventory:
                        data,

                    mapping:
                        mappingData

                })

        }
    )

    .then(
        response =>
            response.json()
    )

    .then(
        result => {

            if(result.error){

                alert(
                    result.error
                );

                return;

            }


            let qrUrl =
                "/qr/" +
                result.file_id;


            let old =
                document.getElementById(
                    "qr-box"
                );


            if(old){

                old.remove();

            }


            let div =
                document.createElement(
                    "div"
                );


            div.id =
                "qr-box";


            div.className =
                "card";


            div.innerHTML = `

                <h3
                    style="text-align:center;"
                >
                    QR코드
                </h3>


                <img
                    src="${qrUrl}"
                    style="
                        width:250px;
                        max-width:100%;
                        display:block;
                        margin:auto;
                    "
                >


                <p
                    style="text-align:center;"
                >
                    QR 스캔 시 엑셀 다운로드
                </p>


                <button
                    onclick="closeQR()"
                    style="
                        background:#f44336;
                    "
                >
                    닫기
                </button>

            `;


            document
                .getElementById(
                    "app"
                )
                .appendChild(div);

        }
    )

    .catch(
        error => {

            console.error(error);

            alert(
                "QR 생성 실패"
            );

        }
    );

}


/* =========================================================
   QR 닫기
========================================================= */

function closeQR(){

    let box =
        document.getElementById(
            "qr-box"
        );


    if(box){

        box.remove();

    }

}


/* =========================================================
   신규 재고
========================================================= */

function toggleNewItem(){

    let box =
        document.getElementById(
            "newItemBox"
        );


    if(
        box.style.display ===
        "none"
        ||
        box.style.display === ""
    ){

        box.style.display =
            "block";

    }
    else {

        box.style.display =
            "none";

    }

}


/* =========================================================
   신규 재고 등록
========================================================= */

function addNewItem(){

    let rack =
        cleanString(
            document.getElementById(
                "new_rack"
            ).value
        );


    let barcode =
        cleanString(
            document.getElementById(
                "new_barcode"
            ).value
        );


    let expiry =
        cleanString(
            document.getElementById(
                "new_exp"
            ).value
        );


    let boxQty =
        cleanNumber(
            document.getElementById(
                "new_box"
            ).value
        );


    let eachQty =
        cleanNumber(
            document.getElementById(
                "new_each"
            ).value
        );


    if(!rack){

        alert(
            "랙 바코드를 입력해주세요."
        );

        return;

    }


    if(!barcode){

        alert(
            "제품 바코드를 입력해주세요."
        );

        return;

    }


    let found =
        findProduct(
            barcode
        );


    let productName =
        found
            ? cleanString(found.상품명)
            : "";


    let owner =
        found
            ? cleanString(found.화주사)
            : "";


    let unitQty =
        found
            ? cleanNumber(found.입수량)
            : 0;


    let total =
        (
            unitQty *
            boxQty
        )
        +
        eachQty;


    data.push({

        "바코드":
            barcode,

        "랙":
            rack,

        "소비기한":
            expiry,

        "수량":
            total,

        "상품명":
            productName,

        "화주사":
            owner,

        "신규":
            true

    });


    saveLocal();


    alert(
        "신규 재고가 등록되었습니다."
    );


    document.getElementById(
        "new_rack"
    ).value = "";


    document.getElementById(
        "new_barcode"
    ).value = "";


    document.getElementById(
        "new_exp"
    ).value = "";


    document.getElementById(
        "new_box"
    ).value = "";


    document.getElementById(
        "new_each"
    ).value = "";


    document.getElementById(
        "newItemBox"
    ).style.display =
        "none";

}


/* =========================================================
   숫자 표시
========================================================= */

function formatNumber(value){

    let number =
        cleanNumber(value);


    return number.toLocaleString(
        "ko-KR"
    );

}


/* =========================================================
   HTML 안전 처리
========================================================= */

function escapeHtml(value){

    let text =
        cleanString(value);


    return text
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   현재 입력 확인
========================================================= */

function findCurrentInput(){

    return null;

}
