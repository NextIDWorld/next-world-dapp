import {
  Button,
  Header,
  Heading,
  Box,
  Text
 } from 'grommet';

 import { useAppContext } from '../hooks/useAppState'


export default function MainHeader(props){

  const { state } = useAppContext();


  return(
    <Header background="brand" align="start" className='navbar'>
      <Heading className='heading' margin="small">NextWorld</Heading>
      <Box align="end" pad="small" alignContent="center" >
        {
          !state.coinbase &&
          <Button primary onClick={props.connect} label="Connect" />

        }
        {
          state.coinbase &&
          <Text size="xsmall" alignSelf="center" alignContent="center">
            ChainId: {state.netId}
            <br/>
            Connected as: {
              state.coinbase
            }
          </Text>
        }
      </Box>
    </Header>
  )
}
