function share(){
    fetch('/save',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(res=>{
        const url = location.origin + "/share/" + res.file_id;

        // 최신 브라우저
        if(navigator.clipboard){
            navigator.clipboard.writeText(url)
                .then(()=> alert("공유 링크 복사됨"))
                .catch(()=> fallbackCopy(url));
        } else {
            fallbackCopy(url);
        }
    });
}

// 구형 브라우저 대응
function fallbackCopy(text){
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    alert("공유 링크 복사됨");
}
