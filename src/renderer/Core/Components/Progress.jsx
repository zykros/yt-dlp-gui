import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, UseState, useEffect, useReducer } from 'react';
import { LinearProgress } from '@mui/material';
import { Progress, Grid } from '@nextui-org/react';

const ProgressTag = (props) => {
  // React Hook
  const { downloadStatus } = props;
  return (
    <div>
      <div className="progressStatus">
        <div>{`Status: ${
          downloadStatus ? downloadStatus.status : 'Queued'
        }`}</div>
        <div>
          {`Percent: ${
            (downloadStatus &&
              downloadStatus.progress.percent &&
              downloadStatus.progress.percent) ||
            0
          }%`}
        </div>
        <div>
          {`Total Size: ${
            (downloadStatus && downloadStatus.progress.totalSize) || 0
          }`}
        </div>
      </div>
      <Progress
        color="gradient"
        status="secondary"
        size="xs"
        indeterminated={
          downloadStatus &&
          downloadStatus.eventType !== 'download' &&
          downloadStatus.eventType !== 'Merger' &&
          downloadStatus.status !== 'Complete'
            ? true
            : false
        }
        value={
          downloadStatus && downloadStatus.status === 'Complete'
            ? 100
            : downloadStatus && downloadStatus.progress.percent
        }
      />
    </div>
  );
};

export default ProgressTag;
