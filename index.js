// Создаю анимацию
// .of - создает экземляр SimilarAnimation
// .setAnimation - устанавливает анимацию и возвращает canvas

let anim = SimilarAnimation.of(600, 300, '/source.mp4');

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
let animations = anim.getAnimationsNames();

// возвращает список анимаций для типа файла экземпляра симиляра
// можно вызывать на любой стадии создания анимации
let animationsFromObject = anim.getAnimationsNames();

// .reset - убирает все изменения на канвасе, отключает анимации
// .setAnimation - указываем новую анимацию
// .play - запускаем ее
animations.forEach(name => {
    addBtn(name, () => anim.reset().setAnimation(name).play());
});

addBtn("to 5s", () => anim.showFrame(5))
addBtn("to 10s", () => anim.showFrame(10))

addBtn("Remove", () => anim.destroy());