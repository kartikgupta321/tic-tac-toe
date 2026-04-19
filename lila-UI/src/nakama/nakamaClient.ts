import { Client, type Socket, type Session } from "@heroiclabs/nakama-js";

const client = new Client(
  "defaultkey",
  "tic-tac-toe-9wut.onrender.com",
  "443",
  true
);

// for local and remove createClient true
// const client = new Client(
//   "defaultkey",
//   "127.0.0.1",
//   "7350",
//   false
// );



let socket: Socket;
let session: Session; 

export function getUsername() {
  return sessionStorage.getItem("username");
}

export async function connectToNakama() {
  const username =
    sessionStorage.getItem("username") || "guest";

  // deviceId per tab
  const deviceId =
    sessionStorage.getItem("deviceId") ||
    crypto.randomUUID();

  sessionStorage.setItem("deviceId", deviceId);

  session = await client.authenticateDevice(
    deviceId,
    true,        // create account if not exists
    username
  );

  socket = client.createSocket(true);
  await socket.connect(session, true);

  console.log("connected to nakama");
  console.log("connected user", session.user_id);
  console.log("username", username);

  return socket;
}

export function getSocket() {
  return socket;
}

export function getUserId() {
  return session?.user_id;
}