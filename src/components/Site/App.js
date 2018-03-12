import React from 'react'
import Document from '../Document/Document'
import "./index.css";
import fetch from 'isomorphic-fetch'
import Loading from './Loading'
import qs from 'querystring'

// https://github.com/github/fetch/issues/89#issuecomment-256610849
function futch(url, opts = {}, onProgress) {
  return new Promise((res, rej) => {
    let xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.open(opts.method || 'get', url);
    for (let k in opts.headers || {})
      xhr.setRequestHeader(k, opts.headers[k]);
    xhr.onload = e => res(e.target);
    xhr.onerror = rej;
    // event.loaded / event.total * 100 ; //event.lengthComputable
    if (onProgress) {
      xhr.upload && xhr.upload.addEventListener('progress', onProgress);
      xhr.addEventListener('progress', onProgress);
    }
    xhr.send(opts.body);
  });
}

class Header extends React.PureComponent {
  onClickTitle = () => {
    this.fileInput && this.fileInput.click();
  };
  gao = (input) => {
    this.fileInput = input;
  };
  
  render() {
    let {file, filename = '', onSelectFile} = this.props;
    return <div className="header">
      <a className="title" href=".">Sketch React</a>
      
      {
        file && <a className="filename" onClick={this.onClickTitle}>
          {filename.replace(/\.sketch$/, '')}
          <input type="file" onChange={onSelectFile} accept=".sketch" hidden ref={this.gao}/>
        </a>
      }
      {!file && <div className="flex"/>}
      <div className="actions">
        <a href="https://github.com/zjuasmn/sketch-react" className="icon-link">
          <svg className="icon" width="16px" height="16px" viewBox="0 0 16 16">
            <path
              d="M8,0 C3.58,0 0,3.58 0,8 C0,11.54 2.29,14.53 5.47,15.59 C5.87,15.66 6.02,15.42 6.02,15.21 C6.02,15.02 6.01,14.39 6.01,13.72 C4,14.09 3.48,13.23 3.32,12.78 C3.23,12.55 2.84,11.84 2.5,11.65 C2.22,11.5 1.82,11.13 2.49,11.12 C3.12,11.11 3.57,11.7 3.72,11.94 C4.44,13.15 5.59,12.81 6.05,12.6 C6.12,12.08 6.33,11.73 6.56,11.53 C4.78,11.33 2.92,10.64 2.92,7.58 C2.92,6.71 3.23,5.99 3.74,5.43 C3.66,5.23 3.38,4.41 3.82,3.31 C3.82,3.31 4.49,3.1 6.02,4.13 C6.66,3.95 7.34,3.86 8.02,3.86 C8.7,3.86 9.38,3.95 10.02,4.13 C11.55,3.09 12.22,3.31 12.22,3.31 C12.66,4.41 12.38,5.23 12.3,5.43 C12.81,5.99 13.12,6.7 13.12,7.58 C13.12,10.65 11.25,11.33 9.47,11.53 C9.76,11.78 10.01,12.26 10.01,13.01 C10.01,14.08 10,14.94 10,15.21 C10,15.42 10.15,15.67 10.55,15.59 C13.71,14.53 16,11.53 16,8 C16,3.58 12.42,0 8,0 L8,0 Z"/>
          </svg>
        </a>
      </div>
    </div>
  }
}
const simpleFiles = [
  'https://zjuasmn.github.io/sketch-react/images/ui-video-simple-john-hansen.sketch',
  'https://zjuasmn.github.io/sketch-react/images/Fitness%20App.sketch',
];
function getName(url) {
  return decodeURIComponent(url.substring(url.lastIndexOf('/') + 1));
}
export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  
  onSelectFile = (e) => {
    if (!e) {
      return this.setState({file: null, filename: ''});
    }
    e.preventDefault();
    let file;
    if (e.dataTransfer) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files.length) {
      file = e.target.files[0];
    }
    if (file) {
      
      this.setState({file, filename: file.name});
    }
  };
  onClickButton = () => {
    this.fileInput && this.fileInput.click();
  };
  gao = (input) => {
    this.fileInput = input;
  };
  selectFileFromURL = (url) => {
    this.setState({file: fetch(url).then(r => r.blob()), filename: getName(url)})
  };
  
  componentWillMount() {
    console.log('mount', this.state);
    let url;
    if (this.props.__url) {// for test
      url = this.props.__url
    } else {
      let queryObj = qs.parse(location.search.substr(1));
      if ('url' in queryObj) {
        url = queryObj['url'];
      }
    }
    if (url) {
      this.setState({loading: true, filename: getName(url)});
      futch(url, {}, (progress) => {
        this.setState({progress})
      })
        .then(e => {
          if (200 <= e.status && e.status < 300) {
            this.setState({loading: false, file: e.response});
          } else {
            throw new Error('fail to fetch file from this url!');
            
          }
        })
        .catch(e => {
          this.setState({loading: false});
          if(e.message) {
            alert(e.message);
          }else{
            alert(`Fail to load from this url. Does it allow cross domain access?`);
          }
          location.search = '';
        });
    }
  }
  
  render() {
    let {file, filename, loading, progress} = this.state;
    console.log('file; ', file);
    return <div style={{height: '100%'}}>
      <Header onSelectFile={this.onSelectFile} file={file} filename={filename}/>
      { loading &&
      <Loading
        style={{
          margin: '120px auto 0'
        }}
        progress={progress}
        filename={filename}
        onCancel={() => location.search = ''}/>}
      {!loading && !file && <div className="home">
        <h2 className="sample-header" style={{textAlign: 'center', marginBottom: -36}}>From Local File</h2>
        <div className="upload-area"
             onDragEnter={(e) => {
               e.preventDefault();
             }}
             onDragLeave={(e) => {
               e.preventDefault();
             }}
             onDragOver={(e) => {
               e.preventDefault();
             }}
             onDrop={this.onSelectFile}
          // onDropCapture={(e) => {
          //   e.preventDefault();
          //   console.log(e);
          //   debugger
          // }}
        >
          <div className="desc">Drop .sketch(v43+) file here</div>
          <a className="upload-button" onClick={this.onClickButton}>Or select from computer<input
            type="file" onChange={this.onSelectFile} accept=".sketch" hidden ref={this.gao}/></a>
        </div>
        <div className="sample">
          <h2 className="sample-header">From URL</h2>
          <input style={{
            width: 320, lineHeight: '32px', boxSizing: 'border-box',
            fontSize:16,
            color: '#666',
            padding: '0 8px',
            outline: 'none',
          }} id="url" defaultValue="https://zjuasmn.github.io/sketch-react/images/Fitness App.sketch"/>
          <a className="upload-button" style={{boxSizing: 'border-box', width: 320, margin: '16px auto'}}
             onClick={() => location.search = `?url=${encodeURIComponent(document.getElementById('url').value)}`}>Go</a>
        </div>
        {/*<div>*/}
        {/*<a className="upload-button" onClick={() => {*/}
        {/*let url = prompt(`Enter the file's URL`);*/}
        {/*if (url) {*/}
        {/*this.selectFileFromURL(url);*/}
        {/*}*/}
        {/*}}>parse .sketch file on web</a>*/}
        {/*</div>*/}
        <div className="sample">
          <h2 className="sample-header">Sample Files</h2>
          <div>
            {simpleFiles.map(url =>
              <div key={url} className="sample-link">
                <a onClick={() => location.search = `?url=${encodeURIComponent(url)}`}>{getName(url)}</a>
                {' ('}<a href={url}>raw</a>)
              </div>
            )}
          </div>
        </div>
      </div>}
      {!loading && file && <Document blob={file} style={{height: `calc(100% - 32px)`}}/>}
    </div>
  }
}