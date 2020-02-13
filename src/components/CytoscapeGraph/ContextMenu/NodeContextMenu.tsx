import * as React from 'react';
import { NodeContextMenuProps } from '../CytoscapeContextMenu';
import { Paths } from '../../../config';
import { style } from 'typestyle';
import { KialiAppState } from '../../../store/Store';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { NodeType } from 'types/Graph';

type ReduxProps = {
  jaegerIntegration: boolean;
  namespaceSelector: boolean;
  jaegerURL: string;
};

const graphContextMenuContainerStyle = style({
  textAlign: 'left'
});

const graphContextMenuTitleStyle = style({
  textAlign: 'left',
  fontSize: '16px',
  borderBottom: '1px solid black'
});

const graphContextMenuItemStyle = style({
  textAlign: 'left',
  fontSize: '12px',
  textDecoration: 'none',
  $nest: {
    '&:hover': {
      backgroundColor: '#def3ff',
      color: '#4d5258'
    }
  }
});

const graphContextMenuItemLinkStyle = style({
  color: '#363636'
});

type Props = NodeContextMenuProps & ReduxProps;

export class NodeContextMenu extends React.PureComponent<Props> {
  private static derivedValuesFromProps(props: Props) {
    let name: string | undefined = '';
    let type = '';
    switch (props.nodeType) {
      case 'app':
        // Prefer workload type for nodes backed by a workload
        if (props.workload && props.parent) {
          name = props.workload;
          type = Paths.WORKLOADS;
        } else {
          type = Paths.APPLICATIONS;
          name = props.app;
        }
        break;
      case 'service':
        type = props.isServiceEntry ? Paths.SERVICEENTRIES : Paths.SERVICES;
        name = props.service;
        break;
      case 'workload':
        name = props.workload;
        type = Paths.WORKLOADS;
        break;
      default:
    }

    return { type, name };
  }

  // @todo: We need take care of this at global app level
  makeDetailsPageUrl(type: string, name?: string) {
    return `/namespaces/${this.props.namespace}/${type}/${name}`;
  }

  getJaegerURL(name?: string) {
    return `${this.props.jaegerURL}/search?service=${name}${
      this.props.namespaceSelector ? `.${this.props.namespace}` : ''
    }`;
  }

  createMenuItem(href: string, title: string, target: string = '_self', external: boolean = false) {
    const commonLinkProps = {
      className: graphContextMenuItemLinkStyle,
      children: title,
      onClick: this.onClick,
      target
    };

    return (
      <div className={graphContextMenuItemStyle}>
        {external ? <a href={href} {...commonLinkProps} /> : <Link to={href} {...commonLinkProps} />}
      </div>
    );
  }

  render() {
    // Disable context menu if we are dealing with a unknown or an inaccessible node
    if (this.props.nodeType === NodeType.UNKNOWN || this.props.isInaccessible) {
      this.props.contextMenu.disable();
      return null;
    }

    const { type, name } = NodeContextMenu.derivedValuesFromProps(this.props);
    const detailsPageUrl = this.makeDetailsPageUrl(type, name);

    return (
      <div className={graphContextMenuContainerStyle}>
        <div className={graphContextMenuTitleStyle}>
          <strong>{name}</strong>
        </div>
        {this.createMenuItem(detailsPageUrl, 'Show Details')}
        {type !== Paths.SERVICEENTRIES && (
          <>
            {this.createMenuItem(`${detailsPageUrl}?tab=traffic`, 'Show Traffic')}
            {type === Paths.WORKLOADS && this.createMenuItem(`${detailsPageUrl}?tab=logs`, 'Show Logs')}
            {this.createMenuItem(
              `${detailsPageUrl}?tab=${type === Paths.SERVICES ? 'metrics' : 'in_metrics'}`,
              'Show Inbound Metrics'
            )}
            {type !== Paths.SERVICES &&
              this.createMenuItem(`${detailsPageUrl}?tab=out_metrics`, 'Show Outbound Metrics')}
            {type === Paths.SERVICES && this.props.jaegerIntegration
              ? this.createMenuItem(`${detailsPageUrl}?tab=traces`, 'Show Traces')
              : this.props.jaegerURL && this.createMenuItem(this.getJaegerURL(name), 'Show Traces', '_blank', true)}
          </>
        )}
      </div>
    );
  }

  private onClick = (_e: React.MouseEvent<HTMLAnchorElement>) => {
    this.props.contextMenu.hide(0);
  };
}

const mapStateToProps = (state: KialiAppState) => ({
  jaegerIntegration: state.jaegerState ? state.jaegerState.integration : false,
  namespaceSelector: state.jaegerState ? state.jaegerState.namespaceSelector : true,
  jaegerURL: state.jaegerState ? state.jaegerState.url : ''
});

export const NodeContextMenuContainer = connect(mapStateToProps)(NodeContextMenu);
