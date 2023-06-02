
// Selecciona el elemento HTML con el id "display" y todos los botones de la calculadora utilizando el método querySelectorAll().
const display = document.querySelector("#display");
const buttons = document.querySelectorAll("button");

// Utiliza el método forEach() para iterar sobre cada botón y asignar un evento onclick a cada uno.
buttons.forEach((item) => {
  item.onclick = () => {

    // Si el botón es el botón "clear", se borra el contenido del elemento "display".
    if (item.id == "clear") {
      display.innerText = "";

    // Si el botón es el botón "backspace", se elimina el último carácter del contenido del elemento "display".
    } else if (item.id == "backspace") {
      let string = display.innerText.toString();
      display.innerText = string.substr(0, string.length - 1);

    /* Si el contenido del elemento "display" no está vacío y el botón es el botón "equal", se evalúa la expresión matemática
     en el contenido del elemento "display" y se muestra el resultado.*/

    } else if (display.innerText != "" && item.id == "equal") {
      display.innerText = eval(display.innerText);

    // Si el contenido del elemento "display" está vacío y el botón es el botón "equal", se muestra un mensaje de error durante 2 segundos.

    } else if (display.innerText == "" && item.id == "equal") {
      display.innerText = "Empty!";
      setTimeout(() => (display.innerText = ""), 2000);

    // Si se presiona cualquier otro botón, se agrega el contenido del botón al elemento "display".
    } else {
      display.innerText += item.id;
    }
  };
});

// Selecciona el botón de alternancia de tema y la calculadora utilizando el método querySelector() de JavaScript.
const themeToggleBtn = document.querySelector(".theme-toggler");
const calculator = document.querySelector(".calculator");

// Asigna un evento onclick al botón de alternancia de tema que cambia la clase de la calculadora para alternar entre los temas claro y oscuro.
themeToggleBtn.onclick = () => {
  calculator.classList.toggle("dark");
};