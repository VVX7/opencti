import React, { Component } from 'react';
import * as PropTypes from 'prop-types';
import { compose } from 'ramda';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Fab from '@material-ui/core/Fab';
import { Edit } from '@material-ui/icons';
import graphql from 'babel-plugin-relay/macro';
import {
  commitMutation,
  QueryRenderer,
  WS_ACTIVATED,
} from '../../../../relay/environment';
import inject18n from '../../../../components/i18n';
import CityEditionContainer from './CityEditionContainer';
import { cityEditionOverviewFocus } from './CityEditionOverview';

const styles = (theme) => ({
  editButton: {
    position: 'fixed',
    bottom: 30,
    right: 30,
  },
  drawerPaper: {
    minHeight: '100vh',
    width: '50%',
    position: 'fixed',
    overflow: 'auto',
    backgroundColor: theme.palette.navAlt.background,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    padding: 0,
  },
});

export const cityEditionQuery = graphql`
  query CityEditionContainerQuery($id: String!) {
    city(id: $id) {
      ...CityEditionContainer_city
    }
    me {
      ...CityEditionContainer_me
    }
  }
`;

class CityEdition extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    if (WS_ACTIVATED) {
      commitMutation({
        mutation: cityEditionOverviewFocus,
        variables: {
          id: this.props.cityId,
          input: { focusOn: '' },
        },
      });
    }
    this.setState({ open: false });
  }

  render() {
    const { classes, cityId } = this.props;
    return (
      <div>
        <Fab
          onClick={this.handleOpen.bind(this)}
          color="secondary"
          aria-label="Edit"
          className={classes.editButton}
        >
          <Edit />
        </Fab>
        <Drawer
          open={this.state.open}
          anchor="right"
          classes={{ paper: classes.drawerPaper }}
          onClose={this.handleClose.bind(this)}
        >
          <QueryRenderer
            query={cityEditionQuery}
            variables={{ id: cityId }}
            render={({ props }) => {
              if (props) {
                return (
                  <CityEditionContainer
                    me={props.me}
                    city={props.city}
                    handleClose={this.handleClose.bind(this)}
                  />
                );
              }
              return <div> &nbsp; </div>;
            }}
          />
        </Drawer>
      </div>
    );
  }
}

CityEdition.propTypes = {
  cityId: PropTypes.string,
  me: PropTypes.object,
  classes: PropTypes.object,
  theme: PropTypes.object,
  t: PropTypes.func,
};

export default compose(
  inject18n,
  withStyles(styles, { withTheme: true }),
)(CityEdition);
