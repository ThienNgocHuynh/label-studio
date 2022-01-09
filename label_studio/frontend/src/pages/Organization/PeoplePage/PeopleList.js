import { formatDistance } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Pagination, Spinner, Userpic } from "../../../components";
import { usePage, usePageSize } from "../../../components/Pagination/Pagination";
import { useAPI } from "../../../providers/ApiProvider";
import { Block, Elem } from "../../../utils/bem";
import { isDefined } from "../../../utils/helpers";
import Select from 'react-select';
import chroma from 'chroma-js';
import { useConfig } from "../../../providers/ConfigProvider";
import { useHistory } from "react-router";
import './PeopleList.styl';

export const PeopleList = ({ onSelect, selectedUser, defaultSelected }) => {
  const api = useAPI();
  const config = useConfig();
  const history = useHistory();
  const [usersList, setUsersList] = useState();
  const [currentPage] = usePage('page', 1);
  const [currentPageSize] = usePageSize('page_size', 30);
  const [totalItems, setTotalItems] = useState(0);

  const colourStyles = {
    control: (styles) => ({ ...styles, backgroundColor: 'white' }),
    option: (styles, { data, isDisabled, isFocused, isSelected }) => {
      const color = chroma(data.color);

      return {
        ...styles,
        backgroundColor: isDisabled
          ? undefined
          : isSelected
            ? data.color
            : isFocused
              ? color.alpha(0.1).css()
              : undefined,
        color: isDisabled
          ? '#ccc'
          : isSelected
            ? chroma.contrast(color, 'white') > 2
              ? 'white'
              : 'black'
            : data.color,
        cursor: isDisabled ? 'not-allowed' : 'default',
  
        ':active': {
          ...styles[':active'],
          backgroundColor: !isDisabled
            ? isSelected
              ? data.color
              : color.alpha(0.3).css()
            : undefined,
        },
      };
    },
    multiValue: (styles, { data }) => {
      const color = chroma(data.color);

      return {
        ...styles,
        backgroundColor: color.alpha(0.1).css(),
      };
    },
    multiValueLabel: (styles, { data }) => ({
      ...styles,
      color: data.color,
    }),
    multiValueRemove: (styles, { data }) => ({
      ...styles,
      color: data.color,
      ':hover': {
        backgroundColor: data.color,
        color: 'white',
      },
    }),
  };

  const handleRoles = async (newValue, actionMeta) => {
    await api.callApi('usersUpdate', {
      params: {
        pk: localStorage.getItem("current-user-id"),
      },
      body: {
        is_staff: newValue.value,
        active_project: null,
      },
    });
    history.go(0);
  };

  const handleProjects = async (newValue, actionMeta) => {
    let theProject = [];

    for (const value of newValue){
      theProject.push(value.value);
    }

    theProject = String(theProject);
    if (theProject.length === 0){
      theProject = null;
    }

    await api.callApi('usersUpdate', {
      params: {
        pk: localStorage.getItem("current-user-id"),
      },
      body: {
        active_project: theProject,
      },
    });

  };

  const getProjectList = async (user) => {
    const projectList = await api.callApi("projects", {
      params: {},
    });

    user = (await api.callApi("users", {
      params: {
        user_id: user.id,
      },
    }))[0];

    const _projects = [];
    const _projectOptions = [];
    let projectActiveList = [];
    
    if (user.active_project !== null){
      projectActiveList = user.active_project.split(',');
    }

    for (const each of projectList.results){
      const colorHex = '#'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');

      for (const eachActive of projectActiveList){
        if (eachActive === String(each.id)){
          _projects.push({
            value: each.id, 
            label: each.title,
            color: colorHex,
          });
        }
      }
      _projectOptions.push({
        value: each.id, 
        label: each.title,
        color: colorHex,
      });
    }

    localStorage.setItem("_projects_" + user.id, JSON.stringify(_projects));
    localStorage.setItem("_projectOptions_" + user.id, JSON.stringify(_projectOptions));

  };

  console.log({ currentPage, currentPageSize });

  const fetchUsers = useCallback(async (page, pageSize) => {
    const response = await api.callApi('memberships', {
      params: {
        pk: 1,
        contributed_to_projects: 1,
        page,
        page_size: pageSize,
      },
    });

    if (response.results) {
      setUsersList(response.results);
      setTotalItems(response.count);
    }
  }, [api]);

  const selectUser = useCallback((user) => {
    if (selectedUser?.id === user.id) {
      onSelect?.(null);
    } else {
      onSelect?.(user);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchUsers(currentPage, currentPageSize);
  }, []);

  useEffect(() => {
    if (isDefined(defaultSelected) && usersList) {
      const selected = usersList.find(({ user }) => user.id === Number(defaultSelected));

      if (selected) selectUser(selected.user);
    }
  }, [usersList, defaultSelected]);

  return (
    <>
      <Block name="people-list">
        <Elem name="wrapper">

          {usersList ? (
            <Elem name="users">
              <Elem name="header">
                <Elem name="column" mix="avatar"/>
                <Elem name="column" mix="email">Email</Elem>
                {/* <Elem name="column" mix="name">Name</Elem> */}
                <Elem name="column" mix="name">Roles</Elem>
                <Elem name="column" mix="name">Projects</Elem>
                <Elem name="column" mix="last-activity"></Elem>
              </Elem>
              <Elem name="body">
                {usersList.map(({ user }) => {
                  const active = user.id === selectedUser?.id;

                  getProjectList(user);

                  const currentIsSuperuser = config.user.is_superuser === "True" ? true : false;
                  const currentIsStaff = config.user.is_staff === "True" ? true : false;

                  return (
                    <Elem key={`user-${user.id}`} name="user" mod={{ active }} onClick={() => selectUser(user)}>
                      <Elem name="field" mix="avatar">
                        <Userpic user={user} style={{ width: 28, height: 28 }}/>
                      </Elem>
                      <Elem name="field" mix="email">
                        {user.email}
                      </Elem>
                      {/* <Elem name="field" mix="name">
                        {user.first_name} {user.last_name}
                      </Elem> */}
                      <Elem style={{ width: "60%", paddingLeft: "10%" }} name="field" mix="role">
                        {( currentIsSuperuser === false ||
                          (currentIsSuperuser === user.is_superuser && currentIsStaff === user.is_staff) || user.is_superuser ? <div>&nbsp;</div> : (
                            <Select 
                              menuPortalTarget={document.querySelector('body')}
                              inputId={user.id}
                              className="basic-single"
                              classNamePrefix="select"
                              value={user.is_staff ? { value: true, label: 'Internal' } : { value: false, label: 'External' }}
                              isSearchable={true}
                              name="color"
                              onChange={handleRoles}
                              options={[
                                { value: true, label: 'Internal' },
                                { value: false, label: 'External' },
                              ]}
                            />
                          )
                        )}
                      </Elem>
                      <Elem style={{ width: "60%", marginLeft: "-10%" }} name="field" mix="project">
                        { (currentIsSuperuser === false && currentIsStaff === false) || (currentIsSuperuser === user.is_superuser && currentIsStaff === user.is_staff) || user.is_superuser || user.is_staff ? <div>&nbsp;</div> : (
                          <Select
                            menuPortalTarget={document.querySelector('body')}
                            closeMenuOnSelect={false}
                            defaultValue={JSON.parse(localStorage.getItem("_projects_" + user.id))}
                            isMulti
                            onChange={handleProjects}
                            options={JSON.parse(localStorage.getItem("_projectOptions_" + user.id))}
                            styles={colourStyles}
                          />
                        )}
                      </Elem>
                      <Elem name="field" mix="last-activity">
                        {formatDistance(new Date(user.last_activity), new Date(), { addSuffix: true })}
                      </Elem>
                    </Elem>
                  );
                })}
              </Elem>
            </Elem>
          ) : (
            <Elem name="loading">
              <Spinner size={36}/>
            </Elem>
          )}
        </Elem>
        <Pagination
          page={currentPage}
          urlParamName="page"
          totalItems={totalItems}
          pageSize={currentPageSize}
          pageSizeOptions={[30, 50, 100]}
          onPageLoad={fetchUsers}
          style={{ paddingTop: 16 }}
        />
      </Block>
    </>
  );
};
