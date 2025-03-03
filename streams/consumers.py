import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SignalingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Adiciona o cliente ao grupo do WebRTC
        await self.channel_layer.group_add("webrtc_group", self.channel_name)
        await self.accept()
        print(f"Cliente conectado: {self.channel_name}")

    async def disconnect(self, close_code):
        # Remove o cliente do grupo ao desconectar
        await self.channel_layer.group_discard("webrtc_group", self.channel_name)
        print(f"Cliente desconectado: {self.channel_name}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if "message" in data:  # Caso seja uma mensagem de chat
            await self.channel_layer.group_send(
                "webrtc_group",
                {
                    "type": "chat_message",
                    "message": data["message"],
                }
            )
        else:  # Caso seja uma mensagem de sinalização (WebRTC)
            await self.channel_layer.group_send(
                "webrtc_group",
                {
                    "type": "signaling_message",
                    "message": data,
                }
            )

    async def chat_message(self, event):
        # Envia a mensagem do chat para o cliente
        await self.send(text_data=json.dumps({
            "type": "chat",
            "message": event["message"]
        }))

    async def signaling_message(self, event):
        # Envia a mensagem de sinalização para o cliente
        await self.send(text_data=json.dumps(event["message"]))
