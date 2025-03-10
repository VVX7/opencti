import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Route, withRouter } from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import { QueryRenderer, requestSubscription } from '../../../relay/environment';
import TopBar from '../nav/TopBar';
import Report from './Report';
import ReportEntities from './ReportEntities';
import ReportKnowledge from './ReportKnowledge';
import ReportObservables from './ReportObservables';
import FileManager from '../common/files/FileManager';
import ReportHeader from './ReportHeader';
import Loader from '../../Loader';

const subscription = graphql`
  subscription RootReportSubscription($id: ID!) {
    stixDomainEntity(id: $id) {
      ... on Report {
        ...Report_report
        ...ReportKnowledgeGraph_report
        ...ReportEditionContainer_report
      }
      ...FileImportViewer_entity
      ...FileExportViewer_entity
    }
  }
`;

const reportQuery = graphql`
  query RootReportQuery($id: String!) {
    report(id: $id) {
      ...Report_report
      ...ReportHeader_report
      ...ReportOverview_report
      ...ReportDetails_report
      ...ReportKnowledge_report
      ...ReportEntities_report
      ...FileImportViewer_entity
      ...FileExportViewer_entity
    }
    me {
      ...ReportKnowledge_me
    }
    connectorsForExport {
      ...FileManager_connectorsExport
    }
  }
`;

class RootReport extends Component {
  componentDidMount() {
    const {
      match: {
        params: { reportId },
      },
    } = this.props;
    const sub = requestSubscription({
      subscription,
      variables: { id: reportId },
    });
    this.setState({ sub });
  }

  componentWillUnmount() {
    this.state.sub.dispose();
  }

  render() {
    const {
      me,
      match: {
        params: { reportId },
      },
    } = this.props;
    return (
      <div>
        <TopBar me={me || null} />
        <QueryRenderer
          query={reportQuery}
          variables={{ id: reportId }}
          render={({ props }) => {
            if (props && props.report) {
              return (
                <div>
                  <Route
                    exact
                    path="/dashboard/reports/all/:reportId"
                    render={(routeProps) => (
                      <Report {...routeProps} report={props.report} />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/reports/all/:reportId/entities"
                    render={(routeProps) => (
                      <ReportEntities
                        {...routeProps}
                        report={props.report}
                        me={props.me}
                      />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/reports/all/:reportId/knowledge"
                    render={(routeProps) => (
                      <ReportKnowledge
                        {...routeProps}
                        report={props.report}
                        me={props.me}
                      />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/reports/all/:reportId/observables"
                    render={(routeProps) => (
                      <ReportObservables {...routeProps} reportId={reportId} />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/reports/all/:reportId/files"
                    render={(routeProps) => (
                      <React.Fragment>
                        <ReportHeader report={props.report} />
                        <FileManager
                          {...routeProps}
                          id={reportId}
                          connectorsExport={props.connectorsForExport}
                          entity={props.report}
                        />
                      </React.Fragment>
                    )}
                  />
                </div>
              );
            }
            return <Loader />;
          }}
        />
      </div>
    );
  }
}

RootReport.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootReport);
