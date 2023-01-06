import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, UseState, useEffect, useReducer } from 'react';
import { Alert, Zoom } from '@mui/material';
import { electron } from 'process';
import ProgressTag from './Progress';
import { Button } from '@nextui-org/react';
import { AiOutlineDownload } from 'react-icons/ai';
import { IoIosCloseCircleOutline } from 'react-icons/io';

const DownloadQueue = (props) => {
  const initialProgress = {};
  // React Hooks
  const [queue, setQueue] = useState([]);
  const [progressInfo, setProgressInfo] = useState({});
  const [downloadPath, setDownloadPath] = useState('');
  const [count, setCount] = useState(0);

  const [formats, setFormats] = useState([
    {
      type: 'video',
      format: 'mp4',
    },
    {
      type: 'video',
      format: 'webm',
    },
    {
      type: 'audio',
      format: 'mp3',
    },
    {
      type: 'audio',
      format: 'm4a',
    },
  ]);

  useEffect(() => {
    window.electron.ipcRenderer.getDownloadPath();

    window.electron.ipcRenderer.once('getDownloadPath', (arg) => {
      setDownloadPath(arg);

      console.log(arg);
    });
  }, []);

  useEffect(() => {
    if (Object.keys(props.data).length > 0) {
      let tempDataArry = [...queue];

      if (tempDataArry.findIndex((data) => data.id === props.data.id) === -1) {
        let tempDataObj = {
          id: props.data.id,
          url: props.data.original_url,
          thumbnail: props.data.thumbnail,
          title: props.data.title,
          duration: props.data.duration_string,
          format: 'mp4',
          command: [
            props.data.original_url,
            '-S',
            'res,ext:mp4:m4a',
            '--recode',
            'mp4',
            '-o',
            `${downloadPath}\\%(title)s.%(ext)s`,
            '--no-mtime',
          ],
        };
        console.log(tempDataObj);
        tempDataArry.push(tempDataObj);

        setQueue(tempDataArry);
      } else {
        props.errorState('Video is already added!', 'success');
      }
    }
  }, [props.data]);

  const downloadHandler = (ytId, command) => {
    window.electron.ipcRenderer.ytdlpDownload(ytId, command);
  };

  const formatChangeHandler = (queueIndex, formatName, formatType) => {
    console.log('clicked/');
    //let queueIndex = queue.findIndex((x) => x.id === ytId);
    let tempQueue = [...queue];
    //let formatType = formats[formats.findIndex((x) => x.format === event.target.value)].type;

    if (formatName === 'webm') {
      tempQueue[queueIndex].command = [
        tempQueue[queueIndex].url,
        '-o',
        `${downloadPath}\\%(title)s.%(ext)s`,
        '--no-mtime',
      ];
    }

    if (formatName === 'mp4') {
      tempQueue[queueIndex].command = [
        props.data.original_url,
        '-S',
        'res,ext:mp4:m4a',
        '--recode',
        'mp4',
        '-o',
        `${downloadPath}\\%(title)s.%(ext)s`,
        '--no-mtime',
      ];
    }

    if (formatType === 'audio') {
      tempQueue[queueIndex].command = [
        tempQueue[queueIndex].url,
        '-f',
        'ba',
        '-x',
        '--audio-format',
        formatName,
        '-o',
        `${downloadPath}\\%(title)s.%(ext)s`,
        '--no-mtime',
      ];
    }

    tempQueue[queueIndex].format = formatName;

    setQueue(tempQueue);

    console.log(queue);
  };

  const removeQueueArray = (index) => {
    let tempQueue = [...queue];

    tempQueue.splice(index, 1);

    setQueue(tempQueue);
  };

  return (
    <div>
      {queue &&
        queue.map((d, index) => (
          <Zoom key={d.id} in={true}>
            <div className="container">
              <div className="video-title">
                {d.title}
                <IoIosCloseCircleOutline
                  className="video-close"
                  onClick={() => removeQueueArray(index)}
                />
              </div>
              <div className="video-details">
                <div className="duration"></div>
                <div className="format">
                  <Button.Group
                    disabled={
                      props.downloadStatus[d.id] &&
                      props.downloadStatus[d.id].status !== 'Complete'
                        ? true
                        : false
                    }
                    className="formatGroup"
                    color="primary"
                    bordered
                    size="sm"
                  >
                    {formats.map((fm) => (
                      <button
                        key={fm.format}
                        className={`buttonGroupItems ${
                          d.format === fm.format && 'formatSelected'
                        }`}
                        onClick={() =>
                          formatChangeHandler(index, fm.format, fm.type)
                        }
                      >
                        {fm.format}
                      </button>
                    ))}
                    <Button
                      id="downloadButton"
                      onClick={() => downloadHandler(d.id, d.command)}
                    >
                      <AiOutlineDownload />
                    </Button>
                  </Button.Group>
                </div>
                <div className="progress">
                  {
                    <ProgressTag
                      downloadStatus={props.downloadStatus[d.id]}
                      progressId={d.id}
                    />
                  }
                </div>
              </div>
              <div
                style={{
                  backgroundImage: `url(${d.thumbnail})`,
                }}
                className="thumbnail"
              ></div>
            </div>
          </Zoom>
        ))}
    </div>
  );
};

export default DownloadQueue;
