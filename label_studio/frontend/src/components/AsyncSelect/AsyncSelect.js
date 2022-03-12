import React, { useState, useEffect } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { useAPI } from '../../providers/ApiProvider';
import { useHistory } from 'react-router';
import { useConfig } from '../../providers/ConfigProvider';

export const AsyncSelect = () => {
  const history = useHistory();
  const config = useConfig();
  
  const handleChange = (newValue, actionMeta) => {
    setTimeout(() => {
      const menuEl = document.querySelector(`#${this.id} [class*="-menu"]`);
      const menuListEl = document.querySelector(
        `#${this.id} [class*="MenuList"]`,
      );

      if (
        menuListEl.children.length === 1 &&
        menuListEl.children[0].innerHTML === ""
      ) {
        menuEl.style.display = "none";
      } else {
        menuEl.style.display = "block";
      }
    });
    localStorage.setItem('workspace-id', newValue.value);
    localStorage.setItem('workspace-name', newValue.label);
    history.push(`/projects?`);
    history.go(0);
  };

  const api = useAPI();
  const filterWorkspace = async (inputValue) => {
    let models;

    if ((config.user.is_superuser === "False" && config.user.is_staff === "False")){
      models = await api.callApi('workspaces', {
        params: {
          query: inputValue,
          active_project: config.user.active_project,
        },
      });
    }else {
      models = await api.callApi('workspaces', {
        params: {
          query: inputValue,
        },
      });
    }

    const options = [];

    for (const item of models) {
      options.push({
        value: String(item.id),
        label: String(item.workspace),
      });
    }

    if (String(localStorage.getItem('workspace-id')) === "-2"){
      const option = options.slice(-1);

      localStorage.setItem('workspace-id', option[0].value);
      localStorage.setItem('workspace-name', option[0].label);
      history.push(`/projects?`);
      history.go(0);
    }

    return options;
  };

  const promiseOptions = (inputValue) =>
    new Promise((resolve) => {
      resolve(filterWorkspace(inputValue));
    });

  const handleCreate = async (inputValue) => {
    console.log(222);
    await api.callApi('createWorkspaceList',{
      body: {
        workspace: inputValue,
      },
    });
    localStorage.setItem('workspace-id', -2);
    localStorage.setItem('workspace-name', '');
    filterWorkspace('');
  };

  return ( !(config.user.is_superuser === "False" && config.user.is_staff === "False") ? 
    <AsyncCreatableSelect defaultInputValue={localStorage.getItem('workspace-name')} onChange={handleChange} cacheOptions defaultOptions loadOptions={promiseOptions} onCreateOption={handleCreate}/> 
    :
    <AsyncCreatableSelect defaultInputValue={localStorage.getItem('workspace-name')} onChange={handleChange} cacheOptions defaultOptions loadOptions={promiseOptions} isValidNewOption={() => false} noOptionsMessage={() => null} promptTextCreator={() => false} formatCreateLabel={() => undefined}/>
  );
};