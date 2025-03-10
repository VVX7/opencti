import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { Route, withRouter } from 'react-router-dom';
import { compose } from 'ramda';
import { createFragmentContainer } from 'react-relay';
import graphql from 'babel-plugin-relay/macro';
import { withStyles } from '@material-ui/core/styles';
import inject18n from '../../../../components/i18n';
import IntrusionSetPopover from './IntrusionSetPopover';
import IntrusionSetKnowledgeBar from './IntrusionSetKnowledgeBar';
import EntityStixRelations from '../../common/stix_relations/EntityStixRelations';
import StixDomainEntityKnowledge from '../../common/stix_domain_entities/StixDomainEntityKnowledge';
import StixRelation from '../../common/stix_relations/StixRelation';
import StixDomainEntityHeader from '../../common/stix_domain_entities/StixDomainEntityHeader';
import StixDomainEntityKillChain from '../../common/stix_domain_entities/StixDomainEntityKillChain';

const styles = () => ({
  container: {
    margin: 0,
    padding: '0 260px 0 0',
  },
});

const inversedRoles = ['origin'];

class IntrusionSetKnowledgeComponent extends Component {
  render() {
    const { classes, intrusionSet } = this.props;
    const link = `/dashboard/threats/intrusion_sets/${intrusionSet.id}/knowledge`;
    return (
      <div className={classes.container}>
        <StixDomainEntityHeader
          stixDomainEntity={intrusionSet}
          PopoverComponent={<IntrusionSetPopover />}
        />
        <IntrusionSetKnowledgeBar intrusionSetId={intrusionSet.id} />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/relations/:relationId"
          render={(routeProps) => (
            <StixRelation
              entityId={intrusionSet.id}
              inversedRoles={inversedRoles}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/overview"
          render={(routeProps) => (
            <StixDomainEntityKnowledge
              stixDomainEntityId={intrusionSet.id}
              stixDomainEntityType="intrusion-set"
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/attribution"
          render={(routeProps) => (
            <EntityStixRelations
              resolveRelationType="attributed-to"
              resolveRelationRole="origin"
              entityId={intrusionSet.id}
              relationType="attributed-to"
              targetEntityTypes={['Threat-Actor', 'Organization', 'User']}
              entityLink={link}
              creationIsFrom={true}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/campaigns"
          render={(routeProps) => (
            <EntityStixRelations
              entityId={intrusionSet.id}
              relationType="attributed-to"
              targetEntityTypes={['Campaign']}
              entityLink={link}
              creationIsFrom={false}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/incidents"
          render={(routeProps) => (
            <EntityStixRelations
              resolveRelationType="attributed-to"
              resolveRelationRole="origin"
              entityId={intrusionSet.id}
              relationType="attributed-to"
              targetEntityTypes={['Incident']}
              entityLink={link}
              creationIsFrom={false}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/malwares"
          render={(routeProps) => (
            <EntityStixRelations
              resolveRelationType="attributed-to"
              resolveRelationRole="origin"
              entityId={intrusionSet.id}
              relationType="uses"
              targetEntityTypes={['Malware']}
              entityLink={link}
              creationIsFrom={true}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/victimology"
          render={(routeProps) => (
            <EntityStixRelations
              resolveRelationType="attributed-to"
              resolveRelationRole="origin"
              resolveViaTypes={[
                {
                  entityType: 'Organization',
                  relationType: 'gathering',
                  relationRole: 'part_of',
                },
                {
                  entityType: 'Organization',
                  relationType: 'localization',
                  relationRole: 'localized',
                },
                {
                  entityType: 'Country',
                  relationType: 'localization',
                  relationRole: 'localized',
                },
              ]}
              entityId={intrusionSet.id}
              relationType="targets"
              targetEntityTypes={[
                'Organization',
                'Sector',
                'City',
                'Country',
                'Region',
              ]}
              entityLink={link}
              exploreLink={`/dashboard/explore/victimology/${intrusionSet.id}`}
              creationIsFrom={true}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/ttp"
          render={(routeProps) => (
            <StixDomainEntityKillChain
              stixDomainEntityId={intrusionSet.id}
              entityLink={link}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/tools"
          render={(routeProps) => (
            <EntityStixRelations
              resolveRelationType="attributed-to"
              resolveRelationRole="origin"
              entityId={intrusionSet.id}
              relationType="uses"
              targetEntityTypes={['Tool']}
              entityLink={link}
              creationIsFrom={true}
              {...routeProps}
            />
          )}
        />
        <Route
          exact
          path="/dashboard/threats/intrusion_sets/:intrusionSetId/knowledge/vulnerabilities"
          render={(routeProps) => (
            <EntityStixRelations
              resolveRelationType="attributed-to"
              resolveRelationRole="origin"
              entityId={intrusionSet.id}
              relationType="targets"
              targetEntityTypes={['Vulnerability']}
              entityLink={link}
              creationIsFrom={true}
              {...routeProps}
            />
          )}
        />
      </div>
    );
  }
}

IntrusionSetKnowledgeComponent.propTypes = {
  intrusionSet: PropTypes.object,
  classes: PropTypes.object,
  t: PropTypes.func,
};

const IntrusionSetKnowledge = createFragmentContainer(
  IntrusionSetKnowledgeComponent,
  {
    intrusionSet: graphql`
      fragment IntrusionSetKnowledge_intrusionSet on IntrusionSet {
        id
        name
        alias
      }
    `,
  },
);

export default compose(
  inject18n,
  withRouter,
  withStyles(styles),
)(IntrusionSetKnowledge);
