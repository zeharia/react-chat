import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://chat-server-production-108d.up.railway.app");

function App() {
  const [username, setUsername] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [room, setRoom] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const [usersList, setUsersList] = useState([]);
  const [roomsList, setRoomsList] = useState([]);

  // Recevoir messages
  useEffect(() => {
    socket.on("receive_private_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("users_list", (users) => {
      setUsersList(users);
    });

    socket.on("active_rooms_list", (rooms) => {
      setRoomsList(rooms);
    });

    socket.on("room_joined", (room) => {
      console.log("Rejoint la room:", room);
    });

    return () => {
      socket.off("receive_private_message");
      socket.off("users_list");
      socket.off("active_rooms_list");
      socket.off("room_joined");
    };
  }, []);

  // Connexion pseudo
  const handleConnect = () => {
    if (username.trim() !== "") {
      socket.emit("join_user", username);
      setIsConnected(true);
    }
  };

  // Rejoindre une discussion privée
  const handleSelectUser = (user) => {
    const privateRoom = [username, user].sort().join("_");
    setRoom(privateRoom);
    setSelectedUser(user);
    setChat([]);

    socket.emit("join_private_room", {
      room: privateRoom,
    });
  };

  // Rejoindre une room depuis la liste de rooms
  const handleJoinRoom = (roomName) => {
    setRoom(roomName);
    setSelectedUser(roomName.replace(username + "_", "").replace("_" + username, ""));
    setChat([]);

    socket.emit("join_private_room", { room: roomName });
  };

  // Envoi message
  const sendMessage = () => {
    if (message.trim() === "" || !room) return;
    socket.emit("private_message", {
      room,
      message,
    });
    setMessage("");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      {!isConnected ? (
        <div>
          <h2>Entrez votre nom :</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ex : alice"
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
            <h3>Utilisateurs connectés :</h3>
            {usersList
              .filter((u) => u !== username)
              .map((user) => (
                <button
                  key={user}
                  onClick={() => handleSelectUser(user)}
                  style={{ marginRight: "10px" }}
                >
                  {user}
                </button>
              ))}
          </div>

          {/* Liste des rooms actives */}
          <div style={{ marginBottom: "2rem" }}>
            <h3>Discussions actives :</h3>
            {roomsList
              .filter((roomName) => roomName.includes(username))
              .map((r) => (
                <button
                  key={r}
                  onClick={() => handleJoinRoom(r)}
                  style={{ marginRight: "10px" }}
                >
                  {r.replace(username + "_", "").replace("_" + username, "")}
                </button>
              ))}
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
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {chat.map((msg, index) => (
                  <p key={index}>
                    <strong>{msg.username} :</strong> {msg.message}
                  </p>
                ))}
              </div>

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écris ton message..."
              />
              <button onClick={sendMessage} style={{ marginLeft: "10px" }}>
                Envoyer
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
