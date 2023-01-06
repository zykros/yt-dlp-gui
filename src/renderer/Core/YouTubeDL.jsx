import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, UseState, useEffect } from 'react';
import { electron } from 'process';
import DownloadQueue from './Components/DownloadQueue';
import { Alert, Slide } from '@mui/material';
import { Button } from '@nextui-org/react';

const YouTubeDL = () => {
  // React Hooks
  const [url, setUrl] = useState('');
  const [progressInfo, setProgressInfo] = useState({});
  const [ytData, setYTData] = useState({});
  const [error, setError] = useState({
    show: false,
    errorMsg: '',
    alertType: 'error',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error.show) {
      const timeId = setTimeout(() => {
        // After 3 seconds set the show value to false
        setError({ show: false, errorMsg: '' });
      }, 3000);

      return () => {
        clearTimeout(timeId);
      };
    }
  }, [error]);

  useEffect(() => {
    window.electron.ipcRenderer.on('ytdlp-download', (arg) => {
      if (arg) {
        let tmpObj = {
          status: arg.status,
          progress: arg.progress,
          isPresent: arg.isPresent,
          eventType: arg.eventType,
        };
        setProgressInfo((prev, current) => {
          return { ...prev, [arg.id]: tmpObj };
        });
      }
      //console.log(initialProgress);
    });
  }, []);

  const downloadAll = (downloadQueue) => {
    downloadQueue.forEach((q) => {
      //window.electron.ipcRenderer.ytdlpDownload(ytId, command);
      console.log(q);
    });
  };

  const focusHandler = () => {
    setUrl('');
  };

  const errorStateHandler = (message, type) => {
    setError({ show: true, errorMsg: message, alertType: type });
  };

  const changeHandler = ({ target: { name, value } }) => {
    setUrl(value);

    const youtubeRegex = new RegExp(
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/
    );

    if (value == '') {
      setLoading(false);
    }

    if (youtubeRegex.test(value)) {
      setLoading(true);
      // Getting YouTube Video Title for the queue
      window.electron.ipcRenderer.ytdlpProbe(value);

      window.electron.ipcRenderer.once('ytdlp-probe', (arg) => {
        //console.log(tempArray[arrayIndex]);

        console.log(arg);

        if (arg == 'failed') {
          setLoading(false);
          setError({
            show: true,
            errorMsg: 'No Video Found!',
            alertType: 'error',
          });
          console.log('tester');
        } else {
          //setDownloadQueueArray(tempArray);

          setYTData(arg);
          setLoading(false);
        }
      });
    } else if (value.length > 0) {
      setLoading(false);
      setError({ show: true, errorMsg: 'Invalid URL', alertType: 'error' });
    }
  };

  return (
    <div className="appContainer">
      <div className="yt-form">
        <input
          name="url"
          value={url}
          color="white"
          onChange={changeHandler}
          onFocus={focusHandler}
          onClick={focusHandler}
          placeholder="Input YouTube Url"
          className={`ytUrlText ${loading && 'box'}`}
        />
      </div>
      {error.show && (
        <Slide direction="up" in={error.show} mountOnEnter unmountOnExit>
          <Alert severity={error.alertType} className="errorAlert">
            {error.errorMsg}
          </Alert>
        </Slide>
      )}
      <div className="yt-items">
        <DownloadQueue
          errorState={(message, type) => errorStateHandler(message, type)}
          downloadStatus={progressInfo}
          data={ytData}
        />
      </div>
      <div>
        {/* <Button onClick={() => console.log(ytData)}>Download All</Button> */}
      </div>
    </div>
  );
};

export default YouTubeDL;
