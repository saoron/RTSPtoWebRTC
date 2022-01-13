let stream = new MediaStream();
let suuid = document.getElementById('suuid').value;

let config = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302'],
    },
  ],
};

const pc = new RTCPeerConnection(config);
pc.onnegotiationneeded = handleNegotiationNeededEvent;

let log = (msg) => {
  document.getElementById('div').innerHTML += msg + '<br>';
};

pc.ontrack = function (event) {
  stream.addTrack(event.track);
  videoElem.srcObject = stream;
  log(event.streams.length + ' track is delivered');
};

pc.oniceconnectionstatechange = (e) => log(pc.iceConnectionState);

async function handleNegotiationNeededEvent() {
  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  getRemoteSdp();
}

var element = document.getElementById('suuid');
console.log(suuid);
console.log(element);
element.classList.add('active');
getCodecInfo();

function getCodecInfo() {
  httpGET('../codec/' + suuid, 'GET').then((data) => {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.log(e);
    } finally {
      console.log(data);
      pc.addTransceiver('video', {
        direction: 'sendrecv',
      });
    }
  });
}

let sendChannel = null;

function getRemoteSdp() {
  httpPOST('../receiver/' + suuid, 'POST', {
    suuid: suuid,
    data: btoa(pc.localDescription.sdp),
  }).then((data) => {
    console.log('-P--', data);
    try {
      pc.setRemoteDescription(
        new RTCSessionDescription({
          type: 'answer',
          sdp: atob(data),
        })
      );
    } catch (e) {
      console.warn(e);
    }
  });
}

function httpGET(theUrl, type, params) {
  return new Promise((resolve, reject) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open(type, theUrl, false); // false for synchronous request
    xmlHttp.send(params ? params : null);
    resolve(xmlHttp.responseText);
  });
}

function httpPOST(theUrl, type, paramsOrig) {
  return new Promise((resolve, reject) => {
    var http = new XMLHttpRequest();
    var params = `suuid=${paramsOrig.suuid}&data=${paramsOrig.data}`;
    http.open('POST', theUrl, true);

    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    http.onreadystatechange = function () {
      //Call a function when the state changes.
      if (http.readyState == 4 && http.status == 200) {
        resolve(http.responseText);
      }
    };
    http.send(params);
  });
}
