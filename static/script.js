/* =========================================================
   숫자 처리
========================================================= */

function cleanNumber(value){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){
        return 0;
    }

    return parseFloat(
        String(value)
            .replace(/,/g, "")
            .trim()
    ) || 0;
}


/* =========================================================
   로컬 저장
========================================================= */

function saveLocal(){

    localStorage.setItem(
        "inventoryData",
        JSON.stringify(data)
    );

}


/* =========================================================
   초기 화면
========================================================= */

function render(){

    if(!data || data.length === 0){

        renderRackScan();

        return;

    }


    updateCompletedCount();


    /*
        현재 랙이 없으면
        랙 스캔부터 시작
    */

    if(!currentRack){

        renderRackScan();

        return;

    }


    /*
        현재 상품이 있으면
        수량 입력 화면
    */

    if(currentProduct){

        renderQuantityInput();

        return;

    }


    /*
        현재 랙은 선택되어 있고
        상품이 없는 경우
        제품 바코드 스캔
    */

    renderProductScan();

}


/* =========================================================
   완료 개수
========================================================= */

function updateCompletedCount(){

    completedCount =
        data.filter(
            item =>
                item["조사완료"] === true
        ).length;

}


/* =========================================================
   진행률
========================================================= */

function getProgress(){

    if(data.length === 0){

        return 0;

    }

    return Math.round(
        (
            completedCount /
            data.length
        ) * 100
    );

}


/* =========================================================
   랙 바코드 스캔 화면
========================================================= */

function renderRackScan(){

    currentProduct = null;


    const app =
        document.getElementById("app");


    const percent =
        getProgress();


    app.innerHTML = `

        <div class="card">

            <div class="scan-title">
                랙 바코드를 스캔하세요
            </div>

            <div class="scan-message">
                PDA 스캐너로 랙 바코드를 스캔해주세요.
            </div>


            <input
                id="rack_barcode"
                placeholder="랙 바코드"
                autocomplete="off"
                inputmode="text"
                autofocus
            >


            <button
                onclick="confirmRack()"
            >
                랙 확인
            </button>


            <div class="progress-box">

                <p>
                    <b>전체 진행률</b>
                    ${completedCount} / ${data.length}
                    (${percent}%)
                </p>

                <div class="progress-background">

                    <div
                        class="progress-bar"
                        style="width:${percent}%"
                    ></div>

                </div>

            </div>


            <button
                class="download-button"
                onclick="download()"
            >
                엑셀 다운로드
            </button>


            <button
                class="share-button"
                onclick="share()"
            >
                엑셀 공유
            </button>


            <button
                class="qr-button"
                onclick="createQR()"
            >
                QR코드 생성
            </button>

        </div>

    `;


    const input =
        document.getElementById(
            "rack_barcode"
        );


    if(input){

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

}


/* =========================================================
   랙 바코드 확인
========================================================= */

function confirmRack(){

    const input =
        document.getElementById(
            "rack_barcode"
        );


    if(!input){

        return;

    }


    const rack =
        input.value.trim();


    if(!rack){

        alert(
            "랙 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    /*
        입력된 랙이 실제 데이터에 존재하는지 확인
    */

    const exists =
        data.some(
            item =>
                String(item["랙"]).trim() === rack
        );


    if(!exists){

        alert(
            "재고조사 데이터에 없는 랙입니다.\n\n" +
            "스캔한 랙 : " + rack
        );

        input.value = "";

        input.focus();

        return;

    }


    currentRack = rack;

    currentProduct = null;


    saveLocal();


    render();

}


/* =========================================================
   제품 바코드 스캔 화면
========================================================= */

function renderProductScan(){

    const app =
        document.getElementById("app");


    const percent =
        getProgress();


    app.innerHTML = `

        <div class="card">


            <div class="current-rack">

                <div class="current-rack-title">
                    현재 랙
                </div>

                <div class="current-rack-value">
                    ${escapeHtml(currentRack)}
                </div>

            </div>


            <div class="scan-title">

                제품 바코드를 스캔하세요

            </div>


            <div class="scan-message">

                현재 랙의 제품을 스캔해주세요.

            </div>


            <input
                id="product_barcode"
                placeholder="제품 바코드"
                autocomplete="off"
                inputmode="numeric"
                autofocus
            >


            <button
                onclick="confirmProduct()"
            >
                제품 확인
            </button>


            <button
                onclick="changeRack()"
                style="background:#777;"
            >
                다른 랙 스캔
            </button>


            <div class="progress-box">

                <p>
                    <b>진행률:</b>
                    ${completedCount} / ${data.length}
                    (${percent}%)
                </p>

                <div class="progress-background">

                    <div
                        class="progress-bar"
                        style="width:${percent}%"
                    ></div>

                </div>

            </div>


            <button
                class="download-button"
                onclick="download()"
            >
                엑셀 다운로드
            </button>


            <button
                class="share-button"
                onclick="share()"
            >
                엑셀 공유
            </button>


            <button
                class="qr-button"
                onclick="createQR()"
            >
                QR코드 생성
            </button>

        </div>

    `;


    const input =
        document.getElementById(
            "product_barcode"
        );


    if(input){

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

}


/* =========================================================
   제품 바코드 확인
========================================================= */

function confirmProduct(){

    const input =
        document.getElementById(
            "product_barcode"
        );


    if(!input){

        return;

    }


    const barcode =
        input.value.trim();


    if(!barcode){

        alert(
            "제품 바코드를 스캔해주세요."
        );

        input.focus();

        return;

    }


    /*
        현재 랙 + 바코드가 일치하는
        재고 데이터를 찾음
    */

    const matches =
        data.filter(
            item =>

                String(
                    item["랙"]
                ).trim() === currentRack &&

                String(
                    item["바코드"]
                ).trim() === barcode
        );


    if(matches.length === 0){

        /*
            바코드는 존재하지만
            현재 랙이 다른 경우
        */

        const barcodeExists =
            data.some(
                item =>
                    String(
                        item["바코드"]
                    ).trim() === barcode
            );


        if(barcodeExists){

            alert(
                "이 제품은 현재 랙에 없습니다.\n\n" +
                "현재 랙 : " + currentRack + "\n" +
                "바코드 : " + barcode
            );

        }else{

            alert(
                "등록되지 않은 제품 바코드입니다.\n\n" +
                "바코드 : " + barcode
            );

        }


        input.value = "";

        input.focus();

        return;

    }


    /*
        같은 랙 + 같은 바코드가
        여러 개일 수 있으므로
        아직 조사하지 않은 항목을 우선 선택
    */

    let item =
        matches.find(
            x =>
                x["조사완료"] !== true
        );


    /*
        전부 조사 완료된 경우
    */

    if(!item){

        alert(
            "이 랙의 해당 제품은\n" +
            "이미 조사 완료되었습니다."
        );

        input.value = "";

        input.focus();

        return;

    }


    currentProduct = item;


    renderQuantityInput();

}


/* =========================================================
   수량 입력 화면
========================================================= */

function renderQuantityInput(){

    if(!currentProduct){

        renderProductScan();

        return;

    }


    const item =
        currentProduct;


    const unitQty =
        cleanNumber(
            item["입수량"]
        );


    const stock =
        cleanNumber(
            item["수량"]
        );


    const app =
        document.getElementById(
            "app"
        );


    app.innerHTML = `

        <div class="card">


            <!-- 현재 랙 -->

            <div class="current-rack">

                <div class="current-rack-title">
                    현재 랙
                </div>

                <div class="current-rack-value">
                    ${escapeHtml(
                        item["랙"] || currentRack
                    )}
                </div>

            </div>


            <!-- 상품 정보 -->

            <div class="product-info">


                <div class="info-row">

                    <span class="info-label">
                        바코드
                    </span>

                    <span class="info-value">
                        ${escapeHtml(
                            item["바코드"] || ""
                        )}
                    </span>

                </div>


                <div class="info-row">

                    <span class="info-label">
                        상품명
                    </span>

                    <span class="info-value">
                        ${escapeHtml(
                            item["상품명"] || ""
                        )}
                    </span>

                </div>


                <div class="info-row">

                    <span class="info-label">
                        화주사
                    </span>

                    <span class="info-value">
                        ${escapeHtml(
                            item["화주사"] || ""
                        )}
                    </span>

                </div>


                <div class="info-row">

                    <span class="info-label">
                        소비기한
                    </span>

                    <span class="info-value">
                        ${escapeHtml(
                            item["소비기한"] || ""
                        )}
                    </span>

                </div>


                <div class="info-row">

                    <span class="info-label">
                        전산수량
                    </span>

                    <span class="info-value">
                        ${formatNumber(stock)}
                    </span>

                </div>


                <div class="info-row">

                    <span class="info-label">
                        입수량
                    </span>

                    <span class="info-value">
                        ${formatNumber(unitQty)}
                    </span>

                </div>


            </div>


            <!-- 수량 입력 -->

            <div class="quantity-title">

                실사 수량 입력

            </div>


            ${
                unitQty > 0

                ?

                `

                <input
                    id="box_qty"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="박스 수량"
                    value="${item["박스수량"] ?? ""}"
                    autocomplete="off"
                >


                <input
                    id="each_qty"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="낱개 수량"
                    value="${item["낱개수량"] ?? ""}"
                    autocomplete="off"
                >

                `

                :

                `

                <input
                    id="each_qty"
                    type="number"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="실제 수량"
                    value="${item["실수량"] ?? ""}"
                    autocomplete="off"
                >

                `
            }


            <!-- 계산 결과 -->

            <div class="quantity-result">

                <div class="quantity-result-label">

                    실수량

                </div>

                <div
                    id="real_qty_display"
                    class="quantity-result-value"
                >

                    0

                </div>

            </div>


            <div
                id="diff_display"
                style="
                    text-align:center;
                    margin-top:10px;
                    font-size:18px;
                    font-weight:bold;
                "
            >

                차이수량 : 0

            </div>


            <!-- 등록 -->

            <button
                onclick="completeProduct()"
            >

                수량 등록

            </button>


            <button
                onclick="cancelProduct()"
                style="background:#777;"
            >

                다시 스캔

            </button>


        </div>

    `;


    /*
        수량 이벤트 등록
    */

    const box =
        document.getElementById(
            "box_qty"
        );


    const each =
        document.getElementById(
            "each_qty"
        );


    if(box){

        box.addEventListener(
            "input",
            calculateRealQty
        );


        box.addEventListener(
            "keydown",
            function(e){

                if(e.key === "Enter"){

                    e.preventDefault();

                    if(each){

                        each.focus();

                    }

                }

            }
        );

    }


    if(each){

        each.addEventListener(
            "input",
            calculateRealQty
        );


        each.addEventListener(
            "keydown",
            function(e){

                if(e.key === "Enter"){

                    e.preventDefault();

                    completeProduct();

                }

            }
        );

    }


    calculateRealQty();


    /*
        PDA 사용 시
        입력창에 자동 포커스
    */

    if(box){

        box.focus();

    }else if(each){

        each.focus();

    }

}


/* =========================================================
   실수량 계산
========================================================= */

function calculateRealQty(){

    if(!currentProduct){

        return;

    }


    const unitQty =
        cleanNumber(
            currentProduct["입수량"]
        );


    let realQty = 0;


    /*
        입수량이 있는 상품
    */

    if(unitQty > 0){

        const box =
            cleanNumber(
                document.getElementById(
                    "box_qty"
                )?.value
            );


        const each =
            cleanNumber(
                document.getElementById(
                    "each_qty"
                )?.value
            );


        realQty =
            (unitQty * box) + each;


        currentProduct["박스수량"] =
            box;


        currentProduct["낱개수량"] =
            each;

    }


    /*
        입수량이 없는 상품
    */

    else{

        const each =
            cleanNumber(
                document.getElementById(
                    "each_qty"
                )?.value
            );


        realQty = each;

    }


    currentProduct["실수량"] =
        realQty;


    /*
        화면 표시
    */

    const display =
        document.getElementById(
            "real_qty_display"
        );


    if(display){

        display.innerText =
            formatNumber(realQty);

    }


    /*
        차이수량
    */

    const stock =
        cleanNumber(
            currentProduct["수량"]
        );


    const diff =
        realQty - stock;


    const diffDisplay =
        document.getElementById(
            "diff_display"
        );


    if(diffDisplay){

        diffDisplay.innerText =
            "차이수량 : " +
            formatNumber(diff);

    }


    currentProduct["차이수량"] =
        diff;


    saveLocal();

}


/* =========================================================
   제품 조사 완료
========================================================= */

function completeProduct(){

    if(!currentProduct){

        return;

    }


    const unitQty =
        cleanNumber(
            currentProduct["입수량"]
        );


    let realQty = 0;


    /*
        입수량 있는 경우
    */

    if(unitQty > 0){

        const box =
            cleanNumber(
                document.getElementById(
                    "box_qty"
                )?.value
            );


        const each =
            cleanNumber(
                document.getElementById(
                    "each_qty"
                )?.value
            );


        realQty =
            (unitQty * box) + each;


        currentProduct["박스수량"] =
            box;


        currentProduct["낱개수량"] =
            each;

    }


    /*
        입수량 없는 경우
    */

    else{

        realQty =
            cleanNumber(
                document.getElementById(
                    "each_qty"
                )?.value
            );

    }


    /*
        수량 입력 확인
    */

    if(realQty < 0){

        alert(
            "수량을 확인해주세요."
        );

        return;

    }


    /*
        저장
    */

    currentProduct["실수량"] =
        realQty;


    currentProduct["차이수량"] =
        realQty -
        cleanNumber(
            currentProduct["수량"]
        );


    currentProduct["조사완료"] =
        true;


    saveLocal();


    updateCompletedCount();


    /*
        현재 상품 초기화
    */

    currentProduct = null;


    /*
        전체 조사 완료 확인
    */

    if(
        completedCount >= data.length
    ){

        renderComplete();

        return;

    }


    /*
        같은 랙의 다음 상품을
        계속 스캔
    */

    renderProductScan();

}


/* =========================================================
   상품 다시 스캔
========================================================= */

function cancelProduct(){

    currentProduct = null;

    renderProductScan();

}


/* =========================================================
   다른 랙
========================================================= */

function changeRack(){

    currentRack = "";

    currentProduct = null;

    renderRackScan();

}


/* =========================================================
   전체 조사 완료
========================================================= */

function renderComplete(){

    const app =
        document.getElementById(
            "app"
        );


    app.innerHTML = `

        <div class="card">

            <div
                style="
                    text-align:center;
                    font-size:28px;
                    font-weight:bold;
                    color:#2e7d32;
                "
            >

                재고조사 완료

            </div>


            <p
                style="
                    text-align:center;
                    font-size:18px;
                "
            >

                전체 ${data.length}건의
                재고조사가 완료되었습니다.

            </p>


            <button
                class="download-button"
                onclick="download()"
            >

                엑셀 다운로드

            </button>


            <button
                class="share-button"
                onclick="share()"
            >

                엑셀 공유

            </button>


            <button
                class="qr-button"
                onclick="createQR()"
            >

                QR코드 생성

            </button>


            <button
                onclick="changeRack()"
                style="background:#777;"
            >

                다시 조사

            </button>

        </div>

    `;

}


/* =========================================================
   숫자 표시
========================================================= */

function formatNumber(value){

    const num =
        cleanNumber(value);


    if(
        Number.isInteger(num)
    ){

        return num.toLocaleString();

    }


    return num.toLocaleString(
        undefined,
        {
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   HTML 안전 처리
========================================================= */

function escapeHtml(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(value)

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
   엑셀 다운로드
========================================================= */

function download(){

    fetch(
        "/save",
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(data)

        }
    )

    .then(
        res =>
            res.json()
    )

    .then(
        res => {

            if(res.error){

                alert(
                    "저장 실패\n\n" +
                    res.error
                );

                return;

            }


            window.location =
                "/download/" +
                res.file_id;

        }
    )

    .catch(
        err => {

            console.error(err);

            alert(
                "엑셀 저장 중 오류가 발생했습니다."
            );

        }
    );

}


/* =========================================================
   공유
========================================================= */

function share(){

    fetch(
        "/save",
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(data)

        }
    )

    .then(
        res =>
            res.json()
    )

    .then(
        res => {

            if(res.error){

                alert(
                    "저장 실패\n\n" +
                    res.error
                );

                return;

            }


            const url =
                location.origin +
                "/share/" +
                res.file_id;


            /*
                PDA에서 공유 기능 사용
            */

            if(
                navigator.share
            ){

                navigator.share({

                    title:
                        "재고조사 결과",

                    text:
                        "재고조사 파일 다운로드",

                    url:
                        url

                }).catch(
                    () => {}
                );


                return;

            }


            /*
                클립보드
            */

            if(
                navigator.clipboard
            ){

                navigator.clipboard
                    .writeText(url)
                    .then(
                        () => {

                            alert(
                                "다운로드 링크가 복사되었습니다."
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

            }else{

                showManualCopy(
                    url
                );

            }

        }
    )

    .catch(
        err => {

            console.error(err);

            alert(
                "공유 링크 생성 실패"
            );

        }
    );

}


/* =========================================================
   수동 링크 복사
========================================================= */

function showManualCopy(url){

    const app =
        document.getElementById(
            "app"
        );


    const div =
        document.createElement(
            "div"
        );


    div.style.marginTop =
        "10px";


    div.innerHTML = `

        <div class="card">

            <p>
                <b>
                    다운로드 링크
                </b>
            </p>


            <p>
                아래 링크를 복사하세요.
            </p>


            <input
                value="${escapeHtml(url)}"
                readonly
                onclick="this.select()"
            >

        </div>

    `;


    app.prepend(div);

}


/* =========================================================
   QR 생성
========================================================= */

function createQR(){

    fetch(
        "/save",
        {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body:
                JSON.stringify(data)

        }
    )

    .then(
        res =>
            res.json()
    )

    .then(
        res => {

            if(res.error){

                alert(
                    "저장 실패\n\n" +
                    res.error
                );

                return;

            }


            const qrUrl =
                "/qr/" +
                res.file_id;


            const old =
                document.getElementById(
                    "qr-box"
                );


            if(old){

                old.remove();

            }


            const div =
                document.createElement(
                    "div"
                );


            div.id =
                "qr-box";


            div.innerHTML = `

                <div class="card">

                    <h3
                        style="
                            text-align:center;
                        "
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
                        style="
                            text-align:center;
                        "
                    >

                        QR 스캔 시
                        엑셀 다운로드

                    </p>


                    <button
                        onclick="closeQR()"
                        style="
                            background:#f44336;
                        "
                    >

                        닫기

                    </button>

                </div>

            `;


            document
                .getElementById(
                    "app"
                )
                .appendChild(div);

        }
    )

    .catch(
        err => {

            console.error(err);

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

    const qrBox =
        document.getElementById(
            "qr-box"
        );


    if(qrBox){

        qrBox.remove();

    }

}


/* =========================================================
   신규 재고 등록
========================================================= */

function addNewItem(){

    const location =
        document.getElementById(
            "new_location"
        )?.value.trim();


    const barcode =
        document.getElementById(
            "new_barcode"
        )?.value.trim();


    const exp =
        document.getElementById(
            "new_exp"
        )?.value.trim();


    const qty =
        cleanNumber(
            document.getElementById(
                "new_qty"
            )?.value
        );


    if(
        !location ||
        !barcode
    ){

        alert(
            "랙과 바코드를 입력해주세요."
        );

        return;

    }


    /*
        신규 상품 데이터
    */

    const newItem = {

        "바코드":
            barcode,

        "랙":
            location,

        "소비기한":
            exp,

        "수량":
            qty,

        "입수량":
            0,

        "상품명":
            "",

        "화주사":
            "",

        "실수량":
            qty,

        "박스수량":
            "",

        "낱개수량":
            "",

        "차이수량":
            0,

        "신규":
            true,

        "조사완료":
            true

    };


    data.push(
        newItem
    );


    saveLocal();


    updateCompletedCount();


    /*
        입력창 초기화
    */

    document.getElementById(
        "new_location"
    ).value = "";


    document.getElementById(
        "new_barcode"
    ).value = "";


    document.getElementById(
        "new_exp"
    ).value = "";


    document.getElementById(
        "new_qty"
    ).value = "";


    document.getElementById(
        "newItemBox"
    ).style.display =
        "none";


    /*
        신규 등록 후
        해당 랙을 현재 랙으로 설정
    */

    currentRack =
        location;


    currentProduct =
        null;


    render();

}


/* =========================================================
   페이지 새로고침 방지용
========================================================= */

window.addEventListener(
    "beforeunload",
    function(){

        saveLocal();

    }
);
