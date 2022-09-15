// Создаю анимацию
// .of - создает экземляр SimilarAnimation
// .setAnimation - устанавливает анимацию и возвращает canvas
// type может быть 'image' и 'video'
let anim = SimilarAnimation.of(200, 200, 'frog.jpg', 'image').setAnimation("imageColorCorrection_0");

document.body.append(anim);

let btns = document.createElement('div')
document.body.append(btns)

function addBtn(name, method) {
    let btn = document.createElement('button');
    btn.innerText = name;
    btn.addEventListener('click', function(e) { method() });

    btns.appendChild(btn);
}

// возвращает список анимаций
let animations = SimilarAnimation.getAnimationsNames('image');

// .reset - убирает все изменения на канвасе, отключает анимации
// .setAnimation - указываем новую анимацию
// .play - запускаем ее
animations.forEach(name => {
    addBtn(name, () => anim.reset().setAnimation(name).play());
});

addBtn("Remove", () => anim.destroy());