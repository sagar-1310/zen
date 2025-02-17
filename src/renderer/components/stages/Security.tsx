/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 */

import { useState, useEffect } from "react";
import { Box, Button } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { selectYaml, selectSchema, setNextStepEnabled } from '../configuration-wizard/wizardSlice';
import { setConfiguration, getConfiguration, getZoweConfig } from '../../../services/ConfigService';
import ContainerCard from '../common/ContainerCard';
import JsonForm from '../common/JsonForms';
import EditorDialog from "../common/EditorDialog";
import Ajv from "ajv";
import { selectInstallationArgs } from "./installation/installationSlice";
import { selectConnectionArgs } from "./connection/connectionSlice";
import { IResponse } from "../../../types/interfaces";
import ProgressCard from "../common/ProgressCard";
import React from "react";
import { createTheme } from '@mui/material/styles';

const Security = () => {
  const theme = createTheme();

  const dispatch = useAppDispatch();
  const schema = useAppSelector(selectSchema);
  const yaml = useAppSelector(selectYaml);
  const setupSchema = schema ? schema.properties.zowe.properties.setup.properties.security : "";
  const [setupYaml, setSetupYaml] = useState(yaml?.zowe.setup.security);
  const [isFormInit, setIsFormInit] = useState(false);
  const [initializeForm, setInitializeForm] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [formError, setFormError] = useState('');
  const [contentType, setContentType] = useState('');
  const [initProgress, setInitProgress] = useState({
    writeYaml: false,
    uploadYaml: false,
    success: false,
  });
  const [showProgress, toggleProgress] = useState(false);
  let timer: any;

  const installationArgs = useAppSelector(selectInstallationArgs);
  const connectionArgs = useAppSelector(selectConnectionArgs);

  const section = 'security';
  const initConfig: any = getConfiguration(section);
  
  const TYPE_YAML = "yaml";
  const TYPE_JCL = "jcl";
  const TYPE_OUTPUT = "output";

  const ajv = new Ajv();
  let securitySchema;
  let validate: any;
  if(schema) {
    securitySchema = schema.properties.zowe.properties.setup.properties.security;
  }

  if(securitySchema) {
    validate = ajv.compile(securitySchema);
  }

  useEffect(() => {
    dispatch(setNextStepEnabled(false));
    if(Object.keys(initConfig) && Object.keys(initConfig).length != 0) {
      setSetupYaml(initConfig);
    }
    setInitializeForm(true);
    setIsFormInit(true);
  }, []);

  useEffect(() => {
    timer = setInterval(() => {
      window.electron.ipcRenderer.getInitSecurityProgress().then((res: any) => {
        setInitProgress(res);
      })
    }, 3000);
    const nextPosition = document.getElementById('init-progress');
    nextPosition.scrollIntoView({behavior: 'smooth'});
  }, [showProgress]);

  const toggleEditorVisibility = (type: any) => {
    setContentType(type);
    setEditorVisible(!editorVisible);
  };

  const process = (event: any) => {
    event.preventDefault();
    toggleProgress(true);
    window.electron.ipcRenderer.initSecurityButtonOnClick(connectionArgs, installationArgs, getZoweConfig()).then((res: IResponse) => {
        dispatch(setNextStepEnabled(res.status));
        clearInterval(timer);
      }).catch(() => {
        clearInterval(timer);
        dispatch(setNextStepEnabled(false));
        console.warn('zwe init security failed');
      });
  }

  const handleFormChange = (data: any, isYamlUpdated?: boolean, customParam?: boolean) => {
    if(!initializeForm) {
      return;
    }
    let newData = isFormInit ? (Object.keys(initConfig).length > 0 ? initConfig: data) : (data ? data : initConfig);
    setIsFormInit(false);

    if (newData) {
      newData = isYamlUpdated ? data.security : newData;

      if(validate) {
        validate(newData);
        if(validate.errors) {
          const errPath = validate.errors[0].schemaPath;
          const errMsg = validate.errors[0].message;
          setStageConfig(false, errPath+' '+errMsg, newData);
        } else {
          setConfiguration(section, newData, true);
          setStageConfig(true, '', newData);
        }
      }
    }
  };

  const setStageConfig = (isValid: boolean, errorMsg: string, data: any) => {
    setIsFormValid(isValid);
    setFormError(errorMsg);
    setSetupYaml(data);
  }

  return (
    <div>
      <Box sx={{ position:'absolute', bottom: '1px', display: 'flex', flexDirection: 'row', p: 1, justifyContent: 'flex-start', [theme.breakpoints.down('lg')]: {flexDirection: 'column',alignItems: 'flex-start'}}}>
        <Button variant="outlined" sx={{ textTransform: 'none', mr: 1 }} onClick={() => toggleEditorVisibility(TYPE_YAML)}>View Yaml</Button>
        <Button variant="outlined" sx={{ textTransform: 'none', mr: 1 }} onClick={() => toggleEditorVisibility(TYPE_JCL)}>Preview Job</Button>
        <Button variant="outlined" sx={{ textTransform: 'none', mr: 1 }} onClick={() => toggleEditorVisibility(TYPE_OUTPUT)}>Submit Job</Button>
      </Box>
      <ContainerCard title="Security" description="Configure Zowe Security.">
        <EditorDialog contentType={contentType} isEditorVisible={editorVisible} toggleEditorVisibility={toggleEditorVisibility} onChange={handleFormChange}/>
        <Box sx={{ width: '60vw' }}>
          {!isFormValid && <div style={{color: 'red', fontSize: 'small', marginBottom: '20px'}}>{formError}</div>}
          <JsonForm schema={setupSchema} onChange={(data: any, isYamlUpdated: boolean) => handleFormChange(data, isYamlUpdated, true)} formData={setupYaml}/>
          <Button sx={{boxShadow: 'none', mr: '12px'}} type="submit" variant="text" onClick={e => process(e)}>Initialize Security Config</Button>
          <Box sx={{height: showProgress ? 'calc(100vh - 220px)' : 'auto'}} id="init-progress">
          {!showProgress ? null :
          <React.Fragment>
            <ProgressCard label={`Write configuration file locally to temp directory`} id="init-security-progress-card" status={initProgress.writeYaml}/>
            <ProgressCard label={`Upload configuration file to ${installationArgs.installationDir}`} id="download-progress-card" status={initProgress.uploadYaml}/>
            <ProgressCard label={`Run zwe init security`} id="success-progress-card" status={initProgress.success}/>
          </React.Fragment>
        }
        </Box>
        </Box>
      </ContainerCard>
    </div>
  );
};

export default Security;