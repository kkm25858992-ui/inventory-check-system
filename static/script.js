function render(){
    if(data.length === 0) return;

    document.getElementById('newItemBtn').style.display = 'block';

    localStorage.setItem("currentIndex", currentIndex);

    let item = data[currentIndex];
    let stock = cleanNumber(item["재고수량"]);

    // 🔥 진행률 계산
    let percent = Math.round(((currentIndex + 1) / data.length) * 100);

    document.getElementById('app').innerHTML = `
        <div class="card">

            <!-- 🔥 진행률 바 -->
            <div style="background:#ddd; border-radius:10px; overflow:hidden; margin-bottom:10px;">
                <div style="
                    width:${percent}%;
                    background:#4caf50;
                    color:white;
                    text-align:center;
                    padding:6px;
                    font-weight:bold;
                ">
                    ${percent}%
                </div>
            </div>

            <!-- 🔥 진행 숫자 -->
            <p style="text-align:center; font-size:14px;">
                ${currentIndex + 1} / ${data.length}
            </p>

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
