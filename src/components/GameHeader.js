import {
  Button,
  Heading,
  Box,
  Paragraph,
 } from 'grommet';

import { useAppContext } from '../hooks/useAppState'


export default function GameHeader(props){

  const { state } = useAppContext();

  return(
    <>
    <Heading className='inst_head'>Welcome to <br/><span style={
      {
        fontFamily: 'franchise',
        fontSize: '100px',
        marginTop:'5px',
        display:'block',
      }
    }>NextWorld</span></Heading>
    <p style={
      {
        textAlign: 'center'
      }
    }>
      Explore
    </p>

    <Box style={
      {
        marginBottom: '15px'
      }
    }>
      <Button primary label="Click to play" id="instructions" />

    </Box>
    <Box>
    {
      !state.coinbase ?
      <Button onClick={props.loadWeb3Modal} label="Connect" /> :
      "Connected"
    }
    </Box>
    {
      props.renderNextIdBox && state.coinbase &&
      props.renderNextIdBox(state.provider)
    }

    </>
  )
}
