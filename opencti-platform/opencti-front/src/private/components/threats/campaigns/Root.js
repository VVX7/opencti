import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Route, Redirect, withRouter } from 'react-router-dom';
import graphql from 'babel-plugin-relay/macro';
import {
  QueryRenderer,
  requestSubscription,
} from '../../../../relay/environment';
import TopBar from '../../nav/TopBar';
import Campaign from './Campaign';
import CampaignReports from './CampaignReports';
import CampaignKnowledge from './CampaignKnowledge';
import CampaignObservables from './CampaignObservables';
import StixDomainEntityHeader from '../../common/stix_domain_entities/StixDomainEntityHeader';
import FileManager from '../../common/files/FileManager';
import CampaignPopover from './CampaignPopover';

const subscription = graphql`
  subscription RootCampaignSubscription($id: ID!) {
    stixDomainEntity(id: $id) {
      ... on Campaign {
        ...Campaign_campaign
        ...CampaignEditionContainer_campaign
      }
      ...FileImportViewer_entity
      ...FileExportViewer_entity
    }
  }
`;

const campaignQuery = graphql`
  query RootCampaignQuery($id: String!) {
    campaign(id: $id) {
      id
      name
      alias
      ...Campaign_campaign
      ...CampaignOverview_campaign
      ...CampaignDetails_campaign
      ...CampaignReports_campaign
      ...CampaignKnowledge_campaign
      ...CampaignObservables_campaign
      ...FileImportViewer_entity
      ...FileExportViewer_entity
    }
    connectorsForExport {
      ...FileManager_connectorsExport
    }
  }
`;

class RootCampaign extends Component {
  componentDidMount() {
    const {
      match: {
        params: { campaignId },
      },
    } = this.props;
    const sub = requestSubscription({
      subscription,
      variables: { id: campaignId },
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
        params: { campaignId },
      },
    } = this.props;
    return (
      <div>
        <TopBar me={me || null} />
        <QueryRenderer
          query={campaignQuery}
          variables={{ id: campaignId }}
          render={({ props }) => {
            if (props && props.campaign) {
              return (
                <div>
                  <Route
                    exact
                    path="/dashboard/threats/campaigns/:campaignId"
                    render={(routeProps) => (
                      <Campaign {...routeProps} campaign={props.campaign} />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/threats/campaigns/:campaignId/reports"
                    render={(routeProps) => (
                      <CampaignReports
                        {...routeProps}
                        campaign={props.campaign}
                      />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/threats/campaigns/:campaignId/knowledge"
                    render={() => (
                      <Redirect
                        to={`/dashboard/threats/campaigns/${campaignId}/knowledge/overview`}
                      />
                    )}
                  />
                  <Route
                    path="/dashboard/threats/campaigns/:campaignId/knowledge"
                    render={(routeProps) => (
                      <CampaignKnowledge
                        {...routeProps}
                        campaign={props.campaign}
                      />
                    )}
                  />
                  <Route
                    path="/dashboard/threats/campaigns/:campaignId/observables"
                    render={(routeProps) => (
                      <CampaignObservables
                        {...routeProps}
                        campaign={props.campaign}
                      />
                    )}
                  />
                  <Route
                    exact
                    path="/dashboard/threats/campaigns/:campaignId/files"
                    render={(routeProps) => (
                      <React.Fragment>
                        <StixDomainEntityHeader
                          stixDomainEntity={props.campaign}
                          PopoverComponent={<CampaignPopover />}
                        />
                        <FileManager
                          {...routeProps}
                          id={campaignId}
                          connectorsExport={props.connectorsForExport}
                          entity={props.campaign}
                        />
                      </React.Fragment>
                    )}
                  />
                </div>
              );
            }
            return <div> &nbsp; </div>;
          }}
        />
      </div>
    );
  }
}

RootCampaign.propTypes = {
  children: PropTypes.node,
  match: PropTypes.object,
  me: PropTypes.object,
};

export default withRouter(RootCampaign);
