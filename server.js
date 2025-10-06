// server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let entregadores = new Map(); // { entregadorId: { ws, lat, lng } }

// Rota teste
app.get("/", (req, res) => {
  res.send("Servidor WebSocket ativo 🚀");
});

// Evento de conexão WebSocket
wss.on("connection", (ws) => {
  console.log("🟢 Novo cliente conectado");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.tipo === "entregador_conectado") {
        entregadores.set(data.entregadorId, { ws });
        console.log(`📦 Entregador ${data.entregadorId} conectado`);
      }

      if (data.tipo === "atualizacao_localizacao") {
        const { entregadorId, latitude, longitude } = data;
        entregadores.set(entregadorId, { ws, lat: latitude, lng: longitude });

        // Reenvia posição para todos (ex: admin ou cliente visualizando)
        const payload = JSON.stringify({
          tipo: "localizacao_atualizada",
          entregadorId,
          latitude,
          longitude,
        });

        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN) client.send(payload);
        });
      }
    } catch (err) {
      console.error("❌ Erro ao processar mensagem:", err);
    }
  });

  ws.on("close", () => {
    entregadores.forEach((v, k) => {
      if (v.ws === ws) entregadores.delete(k);
    });
    console.log("🔴 Cliente desconectado");
  });
});

// Porta dinâmica (Railway define automaticamente)
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`✅ Servidor rodando na porta ${PORT}`));