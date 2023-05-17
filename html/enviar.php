<?php

if (isset($_POST['enviar'])) {
    if (!empty($_POST['email'])) {
        
        $name = $_POST['email'];
        $asunto = "Soy un potencial cliente, vi tu portafolio";
        $email = $_POST['email'];
        $mensaje = "He visto tu pagina web, mi correo es: ".$email;

        $header = "From: noreply@example.com" . "\r\n";
        $header .= "Reply-To: noreply@example.com" . "\r\n";
        $header .= "X-Mailer: PHP/". phpversion();

        $mail = mail($email, $asunto, $mensaje, $header);

        if ($mail) {

            header("Location: ../html/confirmacion.html");
        }
    }
}

?>