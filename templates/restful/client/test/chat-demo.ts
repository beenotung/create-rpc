import { onWSMessage, sendWsMessage } from '../src/api/utils'
import {
  getChatMessages,
  GetChatMessagesOutput,
  sendChatMessage,
} from '../src/api/chat'

type Message = GetChatMessagesOutput['messages'][number]

declare var roomIdInput: HTMLInputElement
declare var messageInput: HTMLInputElement
declare var sendButton: HTMLButtonElement
declare var messageList: HTMLUListElement

let messageTemplate = messageList.querySelector('.message')!
messageTemplate.remove()

roomIdInput.addEventListener('change', event => {
  switchRoom()
})
switchRoom()

messageInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    sendButton.click()
  }
})

async function switchRoom() {
  sendWsMessage({ type: 'leave_room', room_id: joinedRoomId })
  joinedRoomId = +roomIdInput.value
  sendWsMessage({ type: 'join_room', room_id: joinedRoomId })

  messageList.textContent = 'Loading room messages...'
  let json = await getChatMessages({ params: { room_id: joinedRoomId } })

  if (json.messages.length == 0) {
    messageList.textContent = 'No messages yet'
    return
  }

  messageList.textContent = ''
  for (let message of json.messages) {
    showMessage(message)
  }
}

let sendingText = ''
let joinedRoomId = 1

sendButton.addEventListener('click', () => {
  sendingText = messageInput.value
  sendChatMessage({
    params: { room_id: joinedRoomId },
    body: { message: messageInput.value },
  })
})

onWSMessage('room_message', message => {
  if (message.type !== 'room_message') return
  showMessage(message)

  if (
    message.content === sendingText &&
    message.content === messageInput.value
  ) {
    messageInput.value = ''
  }
})

function showMessage(message: Message) {
  let node = messageTemplate.cloneNode(true) as HTMLElement
  node.querySelector('.sender')!.textContent = message.sender_id.toString()
  node.querySelector('.content')!.textContent = message.content
  node.querySelector('.timestamp')!.textContent = new Date(
    message.timestamp,
  ).toLocaleString()
  messageList.appendChild(node)
}
