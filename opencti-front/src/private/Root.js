import React, {Component} from 'react'
import ReactDocumentTitle from 'react-document-title'
import {Route} from 'react-router-dom'
import {withStyles} from '@material-ui/core/styles'
import Snackbar from '@material-ui/core/Snackbar'
import SnackbarContent from '@material-ui/core/SnackbarContent'
import IconButton from '@material-ui/core/IconButton'
import CheckCircle from '@material-ui/icons/CheckCircle'
import Close from '@material-ui/icons/Close'
import TopBar from './components/nav/TopBar'
import LeftBar from './components/nav/LeftBar'
import Dashboard from './components/Dashboard'

const styles = theme => ({
    container: {
        flexGrow: 1,
        zIndex: 1,
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
    },
    content: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.default,
        padding: '24px 24px 24px 84px',
        minWidth: 0
    },
    message: {
        display: 'flex',
        alignItems: 'center',
    },
    messageIcon: {
        marginRight: theme.spacing.unit,
    },
    toolbar: theme.mixins.toolbar
})

class Root extends Component {
    constructor(props) {
        super(props)
        this.state = {snackbarOpen: false}
    }

    snackbarDismiss() {
        this.setState({snackbarOpen: false})
    }

    render() {
        let paddingRight = 24
        return (
            <ReactDocumentTitle title='OpenCTI platform - Dashboard'>
                <div className={this.props.classes.root}>
                    <TopBar/>
                    <LeftBar/>
                    <main className={this.props.classes.content} style={{paddingRight: paddingRight}}>
                        <div className={this.props.classes.toolbar}/>
                        <Route exact path='/dashboard' component={Dashboard}/>
                    </main>
                    <Snackbar
                        anchorOrigin={{vertical: 'top', horizontal: 'right'}}
                        open={this.state.snackbarOpen}
                        onClose={this.snackbarDismiss.bind(this)}
                        autoHideDuration={1500}
                    >
                        <SnackbarContent
                            message={
                                <span className={this.props.classes.message}>
                                    <CheckCircle className={this.props.classes.messageIcon}/>
                                    Action done
                                </span>
                            }
                            action={[
                                <IconButton
                                    key='close'
                                    aria-label='Close'
                                    color='inherit'
                                    onClick={this.snackbarDismiss.bind(this)}
                                >
                                    <Close/>
                                </IconButton>
                            ]}
                        />
                    </Snackbar>
                </div>
            </ReactDocumentTitle>
        )
    }
}

export default withStyles(styles)(Root)