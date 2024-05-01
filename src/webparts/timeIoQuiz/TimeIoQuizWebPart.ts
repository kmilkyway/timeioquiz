import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { BaseClientSideWebPart} from '@microsoft/sp-webpart-base'; 

import TimeIoQuiz from './components/TimeIoQuiz';
import { ITimeIoQuizProps } from './components/ITimeIoQuizProps';




export interface ITimeIoQuizWebPartProps {
  description: string;
}

export default class TimeIoQuizWebPart extends BaseClientSideWebPart<ITimeIoQuizWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ITimeIoQuizProps> = React.createElement(
      TimeIoQuiz,
      {
        httpClient: this.context.httpClient,
        spcontext: this.context
        
      }
    );
   
    ReactDOM.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDOM.unmountComponentAtNode(this.domElement);
  }

 
}
