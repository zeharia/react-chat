import { useEffect, useState } from "react";
import io from "socket.io-client";

// Pour le développement local, utilisez : "http://localhost:3001"
// Pour la production, gardez votre URL Railway
const socket = io("https://chat-server-production-108d.up.railway.app/");

function App() {
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [room, setRoom] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const [usersList, setUsersList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);

  // Gérer les événements Socket.IO
  useEffect(() => {
    // Recevoir les messages privés
    socket.on("receive_private_message", (data) => {
      console.log("Message reçu:", data);
      setChat((prev) => [...prev, data]);
    });

    // Recevoir la liste des utilisateurs
    socket.on("users_list", (users) => {
      console.log("Liste des utilisateurs:", users);
      setUsersList(users);
    });

    // Recevoir la liste des rooms actives
    socket.on("active_rooms_list", (rooms) => {
      console.log("Liste des rooms:", rooms);
      setRoomsList(rooms);
    });

    // Confirmation de rejoindre une room
    socket.on("room_joined", (roomName) => {
      console.log("Rejoint la room:", roomName);
    });

    // Gérer la connexion/déconnexion
    socket.on("connect", () => {
      console.log("Connecté au serveur");
    });

    socket.on("disconnect", () => {
      console.log("Déconnecté du serveur");
    });

    // Nettoyage
    return () => {
      socket.off("receive_private_message");
      socket.off("users_list");
      socket.off("active_rooms_list");
      socket.off("room_joined");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // Connexion avec le nom d'utilisateur
  const handleConnect = () => {
    if (username.trim() !== "") {
      console.log("Connexion avec le nom:", username);
      socket.emit("join_user", username);
      setIsConnected(true);
    }
  };

  // Sélectionner un utilisateur pour chat privé
  const handleSelectUser = (user) => {
    const privateRoom = [username, user].sort().join("_");
    console.log("Sélection de l'utilisateur:", user, "Room:", privateRoom);
    
    setRoom(privateRoom);
    setSelectedUser(user);
    setChat([]); // Vider le chat précédent
    
    socket.emit("join_private_room", {
      room: privateRoom,
    });
  };

  // Rejoindre une room existante
  const handleJoinRoom = (roomName) => {
    console.log("Rejoindre la room:", roomName);
    
    setRoom(roomName);
    // Extraire le nom de l'autre utilisateur
    const otherUser = roomName.replace(username + "_", "").replace("_" + username, "");
    setSelectedUser(otherUser);
    setChat([]);
    
    socket.emit("join_private_room", { room: roomName });
  };

  // Envoyer un message
  const sendMessage = () => {
    if (message.trim() === "" || !room) return;
    
    console.log("Envoi du message:", message, "dans la room:", room);
    
    socket.emit("private_message", {
      room,
      message,
    });
    setMessage("");
  };

  // Gérer la touche Entrée
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial", maxWidth: "800px", margin: "0 auto" }}>
      {!isConnected ? (
        <div>
          <h2>Entrez votre nom :</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ex : alice"
            onKeyPress={(e) => e.key === "Enter" && handleConnect()}
          />
          <button onClick={handleConnect} style={{ marginLeft: "10px" }}>
            Entrer
          </button>
        </div>
      ) : (
        <>
          <h1>Bienvenue, {username}</h1>

          {/* Utilisateurs en ligne */}
          <div style={{ marginBottom: "2rem" }}>
            <h3>Utilisateurs connectés ({usersList.length}):</h3>
            {usersList.length === 0 ? (
              <p>Aucun autre utilisateur connecté</p>
            ) : (
              usersList
                .filter((u) => u !== username)
                .map((user) => (
                  <button
                    key={user}
                    onClick={() => handleSelectUser(user)}
                    style={{ 
                      marginRight: "10px", 
                      marginBottom: "5px",
                      padding: "5px 10px",
                      backgroundColor: selectedUser === user ? "#007bff" : "#f8f9fa",
                      color: selectedUser === user ? "white" : "black",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    {user}
                  </button>
                ))
            )}
          </div>

          {/* Liste des rooms actives */}
          <div style={{ marginBottom: "2rem" }}>
            <h3>Discussions actives ({roomsList.filter(r => r.includes(username)).length}):</h3>
            {roomsList
              .filter((roomName) => roomName.includes(username))
              .map((r) => {
                const otherUser = r.replace(username + "_", "").replace("_" + username, "");
                return (
                  <button
                    key={r}
                    onClick={() => handleJoinRoom(r)}
                    style={{ 
                      marginRight: "10px", 
                      marginBottom: "5px",
                      padding: "5px 10px",
                      backgroundColor: room === r ? "#28a745" : "#f8f9fa",
                      color: room === r ? "white" : "black",
                      border: "1px solid #ccc",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    {otherUser}
                  </button>
                );
              })}
          </div>

          {/* Zone de chat */}
          {room && (
            <div>
              <h2>Discussion avec {selectedUser}</h2>

              <div
                style={{
                  border: "1px solid #ccc",
                  padding: "1rem",
                  marginBottom: "1rem",
                  maxHeight: "400px",
                  overflowY: "auto",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "5px"
                }}
              >
                {chat.length === 0 ? (
                  <p style={{ color: "#666" }}>Aucun message pour le moment...</p>
                ) : (
                  chat.map((msg, index) => (
                    <p key={index} style={{ 
                      margin: "5px 0",
                      padding: "8px",
                      backgroundColor: msg.username === username ? "#e3f2fd" : "#f5f5f5",
                      borderRadius: "3px",
                      textAlign: msg.username === username ? "right" : "left"
                    }}>
                      <strong>{msg.username} :</strong> {msg.message}
                    </p>
                  ))
                )}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écris ton message..."
                  style={{ 
                    flex: 1, 
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "3px"
                  }}
                />
                <button 
                  onClick={sendMessage}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "3px",
                    cursor: "pointer"
                  }}
                >
                  Envoyer
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;