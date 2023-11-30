<?php
// Configuración de la conexión a la base de datos
putenv('MYSQLHOST=monorail.proxy.rlwy.net');
putenv('MYSQLUSER=root');
putenv('MYSQLPASSWORD=b4DD55H1dA323a4HEe1HfA5H12d5C3BD');
putenv('MYSQLDATABASE=railway');
putenv('MYSQLPORT=19487');

// Establecer la conexión a la base de datos
$conn = new mysqli(getenv("MYSQLHOST"), getenv("MYSQLUSER"), getenv("MYSQLPASSWORD"), getenv("MYSQLDATABASE"), getenv("MYSQLPORT"));

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

// Verificar las credenciales al enviar el formulario
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $usuario = $_POST["usuario"];
    $contrasena = $_POST["contrasena"];

    // Consultar la base de datos para las credenciales
    $query = "SELECT * FROM Users WHERE name = ? AND password = ?";
    $stmt = $conn->prepare($query);

    if (!$stmt) {
        die("Error al preparar la consulta: " . $conn->error);
    }

    $stmt->bind_param("ss", $usuario, $contrasena);
    $stmt->execute();

    // Manejo de errores después de $stmt->execute();
    if ($stmt->error) {
        die("Error en la consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $stmt->close();

    // Verificar si las credenciales son correctas
    if ($result->num_rows > 0) {
        // Las credenciales son correctas, redireccionar al usuario a la página principal
        if ($usuario == "victor" && $contrasena == "V1cT0r!") {
            header("Location: ../html/gestor.html");
            exit();
        } else {
            // Las credenciales son incorrectas, establecer un mensaje de error
            $error_message = "Credenciales incorrectas";
        }
    }
}

$conn->close();
?>