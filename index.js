let anim = SimilarAnimation.of(500, 500, 'source.mp4').pixilateAnimation();

document.body.append(anim);

let btns = document.createElement('div')
document.body.append(btns)

function addBtn(name, method) {
    let btn = document.createElement('button');
    btn.innerText = name;
    btn.addEventListener('click', function(e) { method() });

    btns.appendChild(btn);
}

addBtn("Start", x => anim.play());