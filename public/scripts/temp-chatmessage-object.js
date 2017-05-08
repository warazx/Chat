/*  After the user press send on a message, the client sends the chatMessage
    to the server and puts it in the right chatLog.
*/

var chatMessage = {
  id : 34634, //MessageID
  text : "",
  date : Date.now(),
  isPrivateMessage : true,
  sender : 15, //User-ID
  receiver : 16 //UserID / ChatRoomID
};

var chatLog = {
  id : 2525, //ChatRoomID
  messages : [], //chatMessage's
  receivers : [] //UserID's / ChatRoomID
};
