import React, { useEffect, useState } from 'react';
import { useHistory, useParams as useRouterParams } from 'react-router';
import { Redirect } from 'react-router-dom';
import { Button } from '../../components';
import { Oneof } from '../../components/Oneof/Oneof';
import { Spinner } from '../../components/Spinner/Spinner';
import { ApiContext } from '../../providers/ApiProvider';
import { useContextProps } from '../../providers/RoutesProvider';
import { Block, Elem } from '../../utils/bem';
import { CreateProject } from '../CreateProject/CreateProject';
import { DataManagerPage } from '../DataManager/DataManager';
import { SettingsPage } from '../Settings';
import { useAPI } from '../../providers/ApiProvider';
import './Projects.styl';
import { EmptyProjectsList, ProjectsList } from './ProjectsList';
import { confirm } from '../../components/Modal/Modal';
import { useConfig } from '../../providers/ConfigProvider';

const getCurrentPage = () => {
  const pageNumberFromURL = new URLSearchParams(location.search).get("page");

  return pageNumberFromURL ? parseInt(pageNumberFromURL) : 1;
};

export const ProjectsPage = () => {
  const api = React.useContext(ApiContext);
  const [projectsList, setProjectsList] = React.useState([]);
  const [networkState, setNetworkState] = React.useState(null);
  const [currentPage, setCurrentPage] = useState(getCurrentPage());
  const [totalItems, setTotalItems] = useState(1);
  const setContextProps = useContextProps();
  const defaultPageSize = parseInt(localStorage.getItem('pages:projects-list') ?? 30);

  const [modal, setModal] = React.useState(false);
  const openModal = setModal.bind(null, true);
  const closeModal = setModal.bind(null, false);
  const config = useConfig();

  const fetchProjects = async (page  = currentPage, pageSize = defaultPageSize) => {
    setNetworkState('loading');
    let data;
    const workspaces = localStorage.getItem('workspace-id');

    if (config.user.is_superuser === "False" && config.user.is_staff === "False"){
      data = await api.callApi("projects", {
        params: { page, page_size: pageSize, workspaces: workspaces || -1, active_project: config.user.active_project },
      });
    }
    else{
      data = await api.callApi("projects", {
        params: { page, page_size: pageSize, workspaces: workspaces || -1 },
      });
    }

    setTotalItems(data?.count ?? 1);
    setProjectsList(data.results ?? []);
    setNetworkState('loaded');
  };

  const loadNextPage = async (page, pageSize) => {
    setCurrentPage(page);
    await fetchProjects(page, pageSize);
  };

  React.useEffect(() => {
    fetchProjects();
  }, []);

  React.useEffect(() => {
    // there is a nice page with Create button when list is empty
    // so don't show the context button in that case
    setContextProps({ openModal, showButton: projectsList.length > 0 });
  }, [projectsList.length]);

  return (
    <Block name="projects-page">
      <Oneof value={networkState}>
        <Elem name="loading" case="loading">
          <Spinner size={64}/>
        </Elem>
        <Elem name="content" case="loaded">
          {projectsList.length ? (
            <ProjectsList
              projects={projectsList}
              currentPage={currentPage}
              totalItems={totalItems}
              loadNextPage={loadNextPage}
              pageSize={defaultPageSize}
            />
          ) : (
            <EmptyProjectsList openModal={openModal} />
          )}
          {modal &&  <CreateProject onClose={closeModal} />}
        </Elem>
      </Oneof>
    </Block>
  );
};

ProjectsPage.title = "Projects";
ProjectsPage.path = "/projects";
ProjectsPage.exact = true;
ProjectsPage.routes = ({ store }) => [
  {
    title: () => store.project?.title,
    path: "/:id(\\d+)",
    exact: true,
    component: () => {
      const params = useRouterParams();

      return <Redirect to={`/projects/${params.id}/data`}/>;
    },
    pages: {
      DataManagerPage,
      SettingsPage,
    },
  },
];
ProjectsPage.context = ({ openModal, showButton }) => {
  const config = useConfig();
  const [processing, setProcessing] = useState(null);
  const api = useAPI();
  const history = useHistory();
  const handleOnClick = (type) => () => {
    console.log(111);
    confirm({
      title: "Action confirmation",
      body: "You're about to delete all things. This action cannot be undone.",
      okText: "Proceed",
      buttonLook: "destructive",
      onOk: async () => {
        setProcessing(type);
        await api.callApi('deleteWorkspaceList', {
          params: {
            pk: localStorage.getItem('workspace-id'),
          },
        });
        localStorage.setItem('workspace-id', -1);
        localStorage.setItem('workspace-name', '');
        history.replace('');
        history.go(0);
        setProcessing(null);
      },
    });
  };
  const waiting = processing === 'workspace';
  const disabled = (processing && !waiting);
  const type = 'workspaces';

  // if (!showButton) return null;
  return ( 
    <>
      {( !(config.user.is_superuser === "False" && config.user.is_staff === "False") && (
        <><Button style={{ "marginRight": "1rem" }} key={type} look="danger" disabled={disabled} waiting={waiting} onClick={handleOnClick()}>
  Delete Workspace
        </Button>
        <Button onClick={openModal} look="primary" size="compact">Create</Button></>
      )
      )}
    </>
  );
};
