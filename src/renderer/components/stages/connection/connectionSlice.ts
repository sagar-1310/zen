/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../store';
import { IIpcConnectionArgs, IIpcConnectionArgsSecureOptions } from '../../../../types/interfaces';

export interface ConnectionState {
  connectionStatus: boolean;
  connectionArgs: IIpcConnectionArgs;
}

//TODO also seen in ConnectionStore. Necessary or duplication?
const initialState: ConnectionState = {
  connectionStatus: false,
  connectionArgs: {
    host: '',
    connectionType: 'ftp',
    port: 21,
    user: '',
    password: '',
    jobStatement: '',
    secure: false,
    secureOptions: {
      enableTrace: false,
      rejectUnauthorized: true,
      //per node doc, if secureContext missing, this object will be used to create instead
      //the content below is from the object meant to be passed to secureContext.
      //TODO create a "MAX" and "MIN" that gets set to tls.DEFAULT_MAX/MIN_VERSION on server-side?
      maxVersion: "TLSv1.3",
      minVersion: "TLSv1.2"
    }
  },
};

export const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnectionArgs: (state, action: PayloadAction<IIpcConnectionArgs>) => {
      state.connectionArgs = action.payload;
    },
    setHost: (state, action: PayloadAction<string>) => {
      state.connectionArgs.host = action.payload;
    },
    setPort: (state, action: PayloadAction<number>) => {
      state.connectionArgs.port = action.payload;
    },
    setUser: (state, action: PayloadAction<string>) => {
      state.connectionArgs.user = action.payload;
    },
    setPassword: (state, action: PayloadAction<string>) => {
      state.connectionArgs.password = action.payload;
    },
    setJobStatement: (state, action: PayloadAction<string>) => {
      state.connectionArgs.jobStatement = action.payload;
    },
    setSecure: (state, action: PayloadAction<boolean>) => {
      state.connectionArgs.secure = action.payload;
    },
    setSecureOptions: (state, action: PayloadAction<IIpcConnectionArgsSecureOptions>) => {
      state.connectionArgs.secureOptions = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.connectionStatus = action.payload;
    },
  },
});

export const { setConnectionArgs, setConnectionStatus, setHost, setPort,
               setUser, setPassword, setJobStatement, setSecure, setSecureOptions,
             } = connectionSlice.actions;

export const selectConnectionArgs = (state: RootState) => state.connection.connectionArgs;
export const selectConnectionStatus = (state: RootState) => state.connection.connectionStatus;

export default connectionSlice.reducer;
