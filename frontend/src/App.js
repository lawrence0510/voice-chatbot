import React from "react";
import './App.css';
import {
  Button,
  Box,
  Container,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
//非常多的容器以及元件可以使用，可以查查看他的material資料庫有什麼可以利用
import {
  useState,
  useRef,
  useEffect
} from "react";
import { useTheme } from '@mui/material/styles';
import {
  styled,
  keyframes
} from '@mui/system';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicRecorder from 'mic-recorder-to-mp3';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import MicIcon from '@mui/icons-material/Mic'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { API, Amplify } from "aws-amplify";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send"

Amplify.configure({

  Auth: {
    mandatorySignIn: false,
  },
  API: {
    endpoints: [
      {
        name: "api",
        endpoint: "https://ixbcg6vgsc.execute-api.ap-northeast-1.amazonaws.com/dev/get-answer",
      }
    ]
  }
});

function filterMessageObjects(list) {
  return list.map(({ role, content }) => ({ role, content }));
}

function App() {
  const ChatHeader = () => {
    // 定義了一個名為 ChatHeader 的 React 函式元件，也就是標題列。
    return (
      <Typography variant="h4" align="center" gutterBottom>
        {/* 設置文字的樣式變體為 "h4"（標題），水平置中，並在文字下方增加一個間距，讓文字與下方的內容有一些間隔。 */}
        {/* Typography是一個可以把html併入js的技術，要修改什麼格式直接在這邊修改即可，蠻酷的 */}
        Voice Chatbot
      </Typography>
    )
  }

  const mockMessages = [
    {
      role: 'assistant',
      content: 'Hello, how can I help you today?',
      text: 'Hello, how can I help you today?'
    },
  ]
  const [messages, setMessages] = useState(mockMessages);
  const [message, setMessage] = useState("");
  const UserMessage = styled('div', { shouldForwardProp: (prop) => prop !== 'audio' })`
  position: relative;
  background-color: ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.contrastText};
  padding: ${({ theme }) => theme.spacing(1, 2)};
  padding-right: ${({ theme, audio }) => (audio ? theme.spacing(6) : theme.spacing(2))};
  border-radius: 1rem;
  border-top-right-radius: 0;
  align-self: flex-end;
  max-width: 80%;
  word-wrap: break-word;
`;

  const AgentMessage = styled('div')`
  position: relative;
  background-color: ${({ theme }) => theme.palette.grey[300]};
  color: ${({ theme }) => theme.palette.text.primary};
  padding: ${({ theme }) => theme.spacing(1, 2)};
  border-radius: 1rem;
  border-top-left-radius: 0;
  align-self: flex-end;
  max-width: 80%;
  word-wrap: break-word;
`;

  const MessageWrapper = styled('div')`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
  justify-content: ${({ align }) => (align === 'user' ? 'flex-end' : 'flex-start')};
  `;
  // 如果傳送訊息的人是user，就flex-end，如果是agent就flex-start

  const ChatMessages = ({ messages }) => {
    const theme = useTheme();
    const bottomRef = useRef(null);
    const scrollToBottom = () => {
      if (bottomRef.current) {
        if (typeof bottomRef.current.scrollIntoViewIfNeeded === 'function') {
          bottomRef.current.scrollIntoViewIfNeeded({ behavior: 'smooth' });
        } else {
          bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
    // 確保有新訊息的時候也會繼續往下捲到底
    // 1. 先確認bottomRef.current有沒有被定義，如果有，確認scrollIntoViewIfNeeded是可使用的。
    // 2. 如果可以的話，呼叫scrollIntoViewIfNeeded來順暢地往下滑動到底（這個function不一定所有瀏覽器都可以用，safari就不行）

    return (
      <Container>
        <Box sx={{ width: '100%', mt: 4, maxHeight: 300, minHeight: 300, overflow: 'auto' }}>
          <Paper elevation={0} sx={{ padding: 2 }}>
            <List>
              {messages.map((message, index) => (
                <ListItem key={index} sx={{ padding: 0 }}>
                  <ListItemText
                    sx={{ margin: 0 }}
                    primary={
                      <MessageWrapper align={message.role}>
                        {message.role === 'user' ? (
                          <>
                            <UserMessage theme={theme} audio={message.audio}>
                              {message.text}
                              {message.audio && (
                                <IconButton
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    right: 8,
                                    transform: 'translateY(-50%)'
                                  }}
                                  onClick={() => message.audio.play()}
                                >
                                  {/* IconButton的格式設定 */}
                                  <VolumeUpIcon fontSize="small" />
                                </IconButton>
                              )}
                            </UserMessage>
                          </>
                        ) : (
                          <AgentMessage theme={theme}>
                            {message.text}
                          </AgentMessage>
                        )}
                      </MessageWrapper>
                    }
                  />
                </ListItem>
              ))}
              <div ref={bottomRef} />
              {/* 增加這個bottomRef參照來讓自動捲動功能正常 */}
            </List>
          </Paper>
        </Box>
      </Container>

      // 這邊用Container來包裝整個東西，再用Box把全部包起來，並帶有特定的寬、邊界、最大高度等，
      // 然後再用Paper讓聊天區域從背景中凸顯出來，最後再用List來放置聊天訊息
    )
  }
  const [isAudioResponse, setIsAudioResponse] = useState(false);

  const handleSendMessage = async () => {
    //先檢查訊息是否為空
    if (message.trim() !== "") {
      //更新messages的陣列，將新訊息加進去
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "user", content: message, text: message, audio: null },
      ]);

      //清空打字區
      setMessage("");

      //加入ThinkingBubble來告訴使用者chatbot正在處理請求
      setMessages((prevMessages) => [
        ...prevMessages,
        { role: "assistant", content: <ThinkingBubble sx={{ marginBottom: '-5px' }} />, text: <ThinkingBubble sx={{ marginBottom: '-5px' }} />, key: "thinking" },
        //theme?
      ]);

      //使用filterMessageObjects來建立一個只有role和content的array，然後再把新的文字更新到array中
      let messageObjects = filterMessageObjects(messages)
      messageObjects.push({ role: "user", content: message })

      try {
        //透過API.post將文字傳到後端進行處理
        const response = await API.post("api", "/get-answer", {
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            text: message,
            messages: messageObjects,
            isAudioResponse
          },
        })
        console.log(response);

        //將ThinkingBubble移除
        setMessages((prevMessages) => {
          return prevMessages.filter((message) => message.key !== "thinking");
        });
        handleBackendResponse(response);

      }//輸出錯誤 
      catch (error) {
        console.error("Error sending text message", error.response || error.message || error);
        alert("Error sending text message", error.message);
      }


    }
  };

  const handleBackendResponse = (response, id = null) => {
    const generatedText = response.generated_text; //the ChatGPT answer
    const generatedAudio = response.generated_audio; //如果isAudioResponse是true，把答案轉換以後的audio
    const transcription = response.transcription;
    const audioElement = generatedAudio
      ? new Audio(`data: audio/mpeg;base64, ${generatedAudio}`)
      : null;
    const AudioMessage = () => (
      <span>
        {generatedText}{" "}
        {audioElement && (
          <IconButton
            aria-label="play-message"
            onClick={() => {
              audioElement.play();
            }}
          >
            <VolumeUpIcon style={{ cursor: "pointer" }} fontSize="small" />
          </IconButton>
        )}
      </span>
    );
    if (id) {
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.map((message) => {
          if (message.id && message.id === id) {
            return {
              ...message,
              content: transcription,
            };
          }
          return message;
        });
        return [
          ...updatedMessages,
          {
            role: "assistant",
            content: generatedText,
            audio: audioElement,
            text: <AudioMessage />,
          },
        ];
      });
    } else {
      // Simply add the response when no messageId is involved
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: generatedText,
          audio: audioElement,
          text: <AudioMessage />,
        },
      ]);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ pt: 2 }}>
      <ChatHeader />
      <ChatMessages messages={messages} />
      <AudioControls isAudioResponse={isAudioResponse} filterMessageObjects={filterMessageObjects} messages={messages} setMessages={setMessages} handleBackendResponse={handleBackendResponse} />
      <MessageInput message={message} setMessage={setMessage} isAudioResponse={isAudioResponse} handleSendMessage={handleSendMessage} handleBackendResponse={handleBackendResponse} />
      <ResponseFormatToggle isAudioResponse={isAudioResponse} setIsAudioResponse={setIsAudioResponse} />
    </Container>
  );
}

//AudioControl 就是在控制錄音，播放，暫停錄音的功能
//AudioControl 不放在App function裡面是為了讓他更好封裝結構跟邏輯，以及方便管理維護
const AudioControls = ({isAudioResponse, filterMessageObjects, messages, setMessages}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [player, setPlayer] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const startRecording = async () => {
    //這是一個不同步的function(因為使用async)，這樣可以await系統抓到MicRecorder再繼續下去
    const newRecorder = new MicRecorder({ bitRate: 128 });
    //新增一個MicRecorder 叫做newRecorder，設定音質128bit
    try {
      await newRecorder.start();
      //開始錄音
      setIsRecording(true);
      //錄音=true
      setRecorder(newRecorder);
      //設定錄音變數
    } catch (e) {
      console.error(e);
      alert(e);
      //輸出錯誤
    }
  }

  const stopRecording = async () => {
    //同樣是個不同步的function來等await通過繼續執行程式碼
    if (!recorder) return;

    try {
      const [buffer, blob] = await recorder.stop().getMp3();
      //停止錄音並且取得MP3檔案，如果成功，buffer跟blob變數會被getMP3賦予值然後回傳
      const audioFile = new File(buffer, "voice-message.mp3", {
        //這邊就在把剛剛回傳的audiofile的值變成一個真正的MP3file
        type: blob.type,
        lastModified: Date.now(),
        //使用現在時間來作為最後修改時間的值
      });
      setPlayer(new Audio(URL.createObjectURL(audioFile)));
      //創造一個URL來代表這個檔案的位置，new Audio的constructor創建一個新的Audio物件來使用這個URL
      setIsRecording(false);
      setAudioFile(audioFile);
    } catch (e) {
      console.error(e);
      alert(e)
      //輸出錯誤
    }
  }

  const playRecording = () => {
    if (player) {
      player.play();
    }
  }
  //不用過多解釋，就是有player的話就播放

  return (
    <Container>
      <Box sx={{ width: "100%", mt: 4 }}>
        <Grid container spacing={2} justifyContent="flex-end">
          <Grid item xs={12} md>
            <IconButton
              color="primary"
              aria-label="start recording"
              onClick={startRecording}
              disabled={isRecording}
            // 不難理解，就是把onClick事件跟label還有顏色定義好
            >
              <MicIcon />
              {/* 這個動作是把MicIcon這個Icon放進IconButton裡面，讓他有icon */}
            </IconButton>
          </Grid>
          <Grid item xs={12} md>
            <IconButton
              color="secondary"
              aria-label="stop recording"
              onClick={stopRecording}
              isaled={!isRecording}>
              <FiberManualRecordIcon />
            </IconButton>
          </Grid>
          <Grid item xs="auto">
            <Button
              variant="contained"
              disableElevation
              onClick={playRecording}
              disabled={isRecording}
            >
              Play recording
            </Button>
          </Grid>
          <SendButton audioFile={audioFile} isAudioResponse={isAudioResponse} filterMessageObjects={filterMessageObjects} messages={messages} setMessages={setMessages} />
        </Grid>
      </Box>
    </Container>
  )
}

//ResponseFormatToggle就是在設定switch搖桿的method
const ResponseFormatToggle = ({ isAudioResponse, setIsAudioResponse }) => {

  const handleToggleChange = (event) => {
    setIsAudioResponse(event.target.checked);
  };
  //被撥動後觸發事件setIsAudioResponse
  return (
    <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
      <FormControlLabel
        control={
          <Switch
            checked={isAudioResponse}
            onChange={handleToggleChange}
            color="primary"
          />
          //switch就是那個搖桿，改變時呼叫handleToggleChange
        }
        label="Audio reponse"
      />
    </Box>
  )
}

const pulse = keyframes`
0% {
  transform: scale(1);
  opacity:1;}
50%{
  transform: scale(1.1);
  opacity:0.7;
}
100%{
  transform:scale(1);
  opacity:1;
}
`;
const ThinkingBubbleStyled = styled(MoreHorizIcon)`
  animation: ${pulse} 1.2s ease-in-out infinite;
  margin-bottom: -5px;
  `;
const ThinkingBubble = () => {
  const theme = useTheme();
  return <ThinkingBubbleStyled theme={theme} sx={{ marginBottom: '-5px' }} />;
};
const SendButton = ({ audioFile, isAudioResponse, filterMessageObjects, messages, setMessages, handleBackendResponse }) => {
  const theme = useTheme();
  const uploadAudio = async () => {
    //首先先確認這個檔案是否存在
    if (!audioFile) {
      console.log("No audio file to upload");
      return;
    }
    try {
      //使用FileReader來讀取音檔
      const reader = new FileReader();

      //onloadend就是拿來確認檔案是否被完全讀取，async用來確認讀取程序在進一步處理前被讀取成功
      reader.onloadend = async () => {

        const base64Audio = reader.result;

        //使用一個唯一的時間Id來當作這個音檔的檔名
        const messageId = new Date().getTime();

        //創建一個訊息物件
        let messageObjects = filterMessageObjects(messages)

        //把使用者的語音訊息加入到訊息陣列中
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "user", content: "🎤 Audio Message", audio: new Audio(base64Audio), text: "🎤 Audio Message", id: messageId },
        ]);

        // 顯示ThinkingBubble icon來表示機器人正在思考回應
        setMessages((prevMessages) => [
          ...prevMessages,
          { role: "assistant", content: <ThinkingBubble theme={theme} sx={{ marginBottom: '-5px' }} />, text: <ThinkingBubble theme={theme} sx={{ marginBottom: '-5px' }} />, key: "thinking" },
        ]);

        //使用API.post來傳送音檔、訊息、還有isAudioResponse(boolean)到後端來處理
        const response = await API.post("api", "/get-answer", {
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            audio: base64Audio,
            messages: messageObjects,
            isAudioResponse
          },
        });

        //將剛剛的ThinkingBubble移除
        setMessages((prevMessages) => {
          return prevMessages.filter((message) => message.key !== "thinking");
        });
        handleBackendResponse(response, messageId);
      };
      //使用URL來讀取音檔
      reader.readAsDataURL(audioFile);

    } catch (error) {
      console.error("Error uploading audio file:", error);
      alert(error)
    }
  }
  return (
    <Grid item xs="auto">
      <Button
        variant="contained"
        color="primary"
        disableElevation
        onClick={uploadAudio}

        disabled={!audioFile}
        startIcon={<CloudUploadIcon />}
      >
        Upload Audio
      </Button>
    </Grid>
  )
}


const MessageInput = ({ message, setMessage, isAudioResponse, handleSendMessage }) => {
  const handleInputChange = (event) => {
    setMessage(event.target.value);
  }
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center", marginTop: 2 }}>
      <TextField
        variant="outlined"
        fullWidth
        label="Type your message"
        value={message}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
      />
      <IconButton
        color="primary"
        onClick={() => handleSendMessage(isAudioResponse)}
        disabled={message.trim() === ""}
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
}


export default App;