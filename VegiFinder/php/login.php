<?php
// Establecer la conexión a la base de datos
$host = getenv("MYSQLHOST");
$user = "root";
$password = getenv("MYSQL_ROOT_PASSWORD");
$database = getenv("MYSQL_DATABASE");

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

// Verificar las credenciales al enviar el formulario
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $usuario = $_POST["usuario"];
    $contrasena = $_POST["contrasena"];

    // Consultar la base de datos para las credenciales
    $query = "SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $usuario, $contrasena);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    // Verificar si las credenciales son correctas
    if ($result->num_rows > 0) {
        header("Location: listas.html");
        exit();
    } else {
        $error_message = "Credenciales incorrectas";
    }
}

$conn->close();
?>