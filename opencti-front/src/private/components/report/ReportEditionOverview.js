import React, { Component } from 'react';
import PropTypes from 'prop-types';
import graphql from 'babel-plugin-relay/macro';
import { commitMutation, createFragmentContainer, fetchQuery } from 'react-relay';
import { Formik, Field, Form } from 'formik';
import { withStyles } from '@material-ui/core/styles';
import {
  assoc, compose, map, pathOr, pipe, pick,
  difference, head,
} from 'ramda';
import * as Yup from 'yup';
import * as rxjs from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import inject18n from '../../../components/i18n';
import Autocomplete from '../../../components/Autocomplete';
import TextField from '../../../components/TextField';
import { SubscriptionFocus } from '../../../components/Subscription';
import environment from '../../../relay/environment';
import { markingDefinitionsLinesSearchQuery } from '../marking_definition/MarkingDefinitionsLines';
import AutocompleteCreate from '../../../components/AutocompleteCreate';
import { reportCreationIdentitiesSearchQuery } from './ReportCreation';
import IdentityCreation from '../identity/IdentityCreation';

const styles = theme => ({
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    position: 'fixed',
    overflow: 'hidden',
    backgroundColor: theme.palette.navAlt.background,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    padding: '30px 30px 30px 30px',
  },
  createButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
  },
  importButton: {
    position: 'absolute',
    top: 30,
    right: 30,
  },
});

const reportMutationFieldPatch = graphql`
    mutation ReportEditionOverviewFieldPatchMutation($id: ID!, $input: EditInput!) {
        reportEdit(id: $id) {
            fieldPatch(input: $input) {
                ...ReportEditionOverview_report
            }
        }
    }
`;

const reportEditionOverviewFocus = graphql`
    mutation ReportEditionOverviewFocusMutation($id: ID!, $input: EditContext!) {
        reportEdit(id: $id) {
            contextPatch(input : $input) {
                ...ReportEditionOverview_report
            }
        }
    }
`;

const reportMutationRelationAdd = graphql`
    mutation ReportEditionOverviewRelationAddMutation($id: ID!, $input: RelationAddInput!) {
        reportEdit(id: $id) {
            relationAdd(input: $input) {
                from {
                    ...ReportEditionOverview_report
                }
            }
        }
    }
`;

const reportMutationRelationDelete = graphql`
    mutation ReportEditionOverviewRelationDeleteMutation($id: ID!, $relationId: ID!) {
        reportEdit(id: $id) {
            relationDelete(relationId: $relationId)
        }
    }
`;

const reportValidation = t => Yup.object().shape({
  name: Yup.string()
    .required(t('This field is required')),
  published: Yup.date()
    .typeError(t('This field must be a valid date2'))
    .required(t('This field is required')),
});

// We wait 0.5 sec of interruption before saving.
const onFormChange$ = new rxjs.Subject().pipe(
  debounceTime(500),
);

class ReportEditionOverviewComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { killChainPhases: [], markingDefinitions: [] };
  }

  componentDidMount() {
    this.subscription = onFormChange$.subscribe(
      (data) => {
        commitMutation(environment, {
          mutation: reportMutationFieldPatch,
          variables: {
            id: data.id,
            input: data.input,
          },
        });
      },
    );
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  searchIdentities(event) {
    fetchQuery(environment, reportCreationIdentitiesSearchQuery, { search: event.target.value }).then((data) => {
      const identities = pipe(
        pathOr([], ['identities', 'edges']),
        map(n => ({ label: n.node.name, value: n.node.id })),
      )(data);
      this.setState({ identities });
    });
  }

  handleOpenIdentityCreation(inputValue) {
    this.setState({ identityCreation: true, identityInput: inputValue });
  }

  handleCloseIdentityCreation() {
    this.setState({ identityCreation: false });
  }

  searchMarkingDefinitions(event) {
    fetchQuery(environment, markingDefinitionsLinesSearchQuery, { search: event.target.value })
      .then((data) => {
        const markingDefinitions = pipe(
          pathOr([], ['markingDefinitions', 'edges']),
          map(n => ({ label: n.node.definition, value: n.node.id })),
        )(data);
        this.setState({ markingDefinitions });
      });
  }

  handleChangeField(name, value) {
    // Validate the field first, if field is valid, debounce then save.
    reportValidation(this.props.t).validateAt(name, { [name]: value }).then(() => {
      onFormChange$.next({ id: this.props.report.id, input: { key: name, value } });
    });
  }

  handleChangeFocus(name) {
    commitMutation(environment, {
      mutation: reportEditionOverviewFocus,
      variables: {
        id: this.props.report.id,
        input: {
          focusOn: name,
        },
      },
    });
  }

  handleChangeMarkingDefinition(name, values) {
    const { report } = this.props;
    const currentMarkingDefinitions = pipe(
      pathOr([], ['markingDefinitions', 'edges']),
      map(n => ({ label: n.node.definition, value: n.node.id, relationId: n.relation.id })),
    )(report);

    const added = difference(values, currentMarkingDefinitions);
    const removed = difference(currentMarkingDefinitions, values);

    if (added.length > 0) {
      commitMutation(environment, {
        mutation: reportMutationRelationAdd,
        variables: {
          id: this.props.report.id,
          input: {
            fromRole: 'so', toId: head(added).value, toRole: 'marking', through: 'object_marking_refs',
          },
        },
      });
    }

    if (removed.length > 0) {
      commitMutation(environment, {
        mutation: reportMutationRelationDelete,
        variables: {
          id: this.props.report.id,
          relationId: head(removed).relationId,
        },
      });
    }
  }

  render() {
    const {
      t, report, editUsers, me,
    } = this.props;
    const killChainPhases = pipe(
      pathOr([], ['killChainPhases', 'edges']),
      map(n => ({ label: `[${n.node.kill_chain_name}] ${n.node.phase_name}`, value: n.node.id, relationId: n.relation.id })),
    )(report);
    const markingDefinitions = pipe(
      pathOr([], ['markingDefinitions', 'edges']),
      map(n => ({ label: n.node.definition, value: n.node.id, relationId: n.relation.id })),
    )(report);
    const initialValues = pipe(
      assoc('killChainPhases', killChainPhases),
      assoc('markingDefinitions', markingDefinitions),
      pick(['name', 'description', 'killChainPhases', 'markingDefinitions']),
    )(report);
    return (
      <div>
        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          validationSchema={reportValidation(t)}
          render={({ setFieldValue }) => (
            <div>
              <Form style={{ margin: '20px 0 20px 0' }}>
                <Field name='name' component={TextField} label={t('Name')} fullWidth={true}
                       onFocus={this.handleChangeFocus.bind(this)}
                       onChange={this.handleChangeField.bind(this)}
                       helperText={<SubscriptionFocus me={me} users={editUsers} fieldName='name'/>}/>
                <Field name='published' component={TextField} label={t('Publication date')}
                       fullWidth={true} style={{ marginTop: 10 }}
                       onFocus={this.handleChangeFocus.bind(this)}
                       onChange={this.handleChangeField.bind(this)}
                       helperText={<SubscriptionFocus me={me} users={editUsers} fieldName='published'/>}/>
                <Field name='description' component={TextField} label={t('Description')}
                       fullWidth={true} multiline={true} rows='4' style={{ marginTop: 10 }}
                       onFocus={this.handleChangeFocus.bind(this)}
                       onChange={this.handleChangeField.bind(this)}
                       helperText={<SubscriptionFocus me={me} users={editUsers} fieldName='description'/>}/>
                <Field
                  name='createdByRef'
                  component={AutocompleteCreate}
                  multiple={false}
                  handleCreate={this.handleOpenIdentityCreation.bind(this)}
                  label={t('Author')}
                  options={this.state.identities}
                  onInputChange={this.searchIdentities.bind(this)}
                  onChange={this.handleChangeCreatedByRef.bind(this)}
                  onFocus={this.handleChangeFocus.bind(this)}
                  helperText={<SubscriptionFocus me={me} users={editUsers} fieldName='killChainPhases'/>}
                />
                <Field
                  name='markingDefinitions'
                  component={Autocomplete}
                  multiple={true}
                  label={t('Marking')}
                  options={this.state.markingDefinitions}
                  onInputChange={this.searchMarkingDefinitions.bind(this)}
                  onChange={this.handleChangeMarkingDefinition.bind(this)}
                  onFocus={this.handleChangeFocus.bind(this)}
                  helperText={<SubscriptionFocus me={me} users={editUsers} fieldName='markingDefinitions'/>}
                />
              </Form>
              <IdentityCreation
                contextual={true}
                inputValue={this.state.identityInput}
                open={this.state.identityCreation}
                handleClose={this.handleCloseIdentityCreation.bind(this)}
                creationCallback={(data) => {
                  setFieldValue('createdByRef', { label: data.identityAdd.name, value: data.identityAdd.id });
                }}
              />
            </div>
          )}
        />
      </div>
    );
  }
}

ReportEditionOverviewComponent.propTypes = {
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
  report: PropTypes.object,
  editUsers: PropTypes.array,
  me: PropTypes.object,
};

const ReportEditionOverview = createFragmentContainer(ReportEditionOverviewComponent, {
  report: graphql`
      fragment ReportEditionOverview_report on Report {
          id
          name
          description
          markingDefinitions {
              edges {
                  node {
                      id
                      definition
                      definition_type
                  }
                  relation {
                      id
                  }
              }
          }
      }
  `,
});

export default compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(ReportEditionOverview);