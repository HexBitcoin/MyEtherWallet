import { TrezorWallet } from 'libs/wallet';
import React, { Component } from 'react';
import translate, { translateRaw } from 'translations';
import TrezorConnect from 'vendor/trezor-connect';
import DeterministicWalletsModal from './DeterministicWalletsModal';
import './Trezor.scss';
import { Spinner } from 'components/ui';
import { getSingleDPathValue, getNetworkConfig, getPaths } from 'selectors/config';
import { AppState } from 'reducers';
import { connect } from 'react-redux';
import { SecureWallets } from 'config';

interface Props {
  onUnlock(param: any): void;
}

interface StateProps {
  dPath: string;
}

interface State {
  publicKey: string;
  chainCode: string;
  dPath: string;
  error: string | null;
  isLoading: boolean;
}

class TrezorDecryptClass extends Component<Props & StateProps, State> {
  public state: State = {
    publicKey: '',
    chainCode: '',
    dPath: this.props.dPath,
    error: null,
    isLoading: false
  };

  public render() {
    const { dPath, publicKey, chainCode, error, isLoading } = this.state;
    const showErr = error ? 'is-showing' : '';

    return (
      <div className="TrezorDecrypt">
        <button
          className="TrezorDecrypt-decrypt btn btn-primary btn-lg btn-block"
          onClick={this.handleNullConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="TrezorDecrypt-message">
              <Spinner light={true} />
              Unlocking...
            </div>
          ) : (
            translate('ADD_Trezor_scan')
          )}
        </button>

        <a
          className="TrezorDecrypt-buy btn btn-sm btn-default"
          href="https://trezor.io/?a=myetherwallet.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          {translate('Don’t have a TREZOR? Order one now!')}
        </a>

        <div className={`TrezorDecrypt-error alert alert-danger ${showErr}`}>{error || '-'}</div>

        <div className="TrezorDecrypt-help">
          Guide:{' '}
          <a
            href="https://blog.trezor.io/trezor-integration-with-myetherwallet-3e217a652e08"
            target="_blank"
            rel="noopener noreferrer"
          >
            How to use TREZOR with MyEtherWallet
          </a>
        </div>

        <DeterministicWalletsModal
          isOpen={!!publicKey && !!chainCode}
          publicKey={publicKey}
          chainCode={chainCode}
          dPath={dPath}
          dPaths={getPaths(SecureWallets.TREZOR)}
          onCancel={this.handleCancel}
          onConfirmAddress={this.handleUnlock}
          onPathChange={this.handlePathChange}
          walletType={translateRaw('x_Trezor')}
        />
      </div>
    );
  }

  private handlePathChange = (dPath: string) => {
    this.setState({ dPath });
    this.handleConnect(dPath);
  };

  private handleConnect = (dPath: string = this.state.dPath): void => {
    this.setState({
      isLoading: true,
      error: null
    });

    TrezorConnect.getXPubKey(
      dPath,
      res => {
        if (res.success) {
          this.setState({
            dPath,
            publicKey: res.publicKey,
            chainCode: res.chainCode,
            isLoading: false
          });
        } else {
          this.setState({
            error: res.error,
            isLoading: false
          });
        }
      },
      '1.5.2'
    );
  };

  private handleCancel = () => {
    this.reset();
  };

  private handleUnlock = (address: string, index: number) => {
    this.props.onUnlock(new TrezorWallet(address, this.state.dPath, index));
    this.reset();
  };

  private handleNullConnect = (): void => this.handleConnect();

  private reset() {
    this.setState({
      publicKey: '',
      chainCode: '',
      dPath: this.props.dPath
    });
  }
}

function mapStateToProps(state: AppState): StateProps {
  const network = getNetworkConfig(state).name;
  return {
    dPath: getSingleDPathValue(SecureWallets.TREZOR, network)
  };
}

export const TrezorDecrypt = connect(mapStateToProps, {})(TrezorDecryptClass);
