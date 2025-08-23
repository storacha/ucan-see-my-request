import { useState, useEffect, ReactNode } from "react"
import { AgentMessage, Invocation, Receipt, Capability, Proof, Delegation as DelegationType} from "@ucanto/interface"
import { isDelegation} from '@ucanto/core'
import { Request, isChromeRequest } from './types'
import * as DagJSON from '@ipld/dag-json'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import {shortString, bigIntSafe, messageFromRequest, decodeMessage, formatError, getRequestStatus, getStatusColor} from './util'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Paper from '@mui/material/Paper'
import CloseIcon from '@mui/icons-material/Close';
import Tooltip from '@mui/material/Tooltip';

import { Fragment } from 'react'
import { Delegation } from "@ucanto/core/delegation";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
 
function TableDisplay({ size,  index , children} : React.PropsWithChildren<{size? : "small" | "medium", index : Record<string, React.ReactNode> }>) {
  return (
      <Table size={size}>
        <TableBody>
          {
            Object.entries(index).map(([heading, value]) => {
              return <TableRow>
                <TableCell></TableCell>
                <TableCell>{heading}</TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            })
          }
          {children}
        </TableBody>
      </Table>
  )
}

function CapabilityDisplay({ capability } : { capability: Capability }) {
  const index : Record<string, React.ReactNode> = Object.assign({
    Can: capability.can,
    With: shortString(capability.with, 60)
  }, capability.nb ? { NB: JSON.stringify(capability.nb, bigIntSafe, 4) } : {})
  return (
    <TableDisplay size="small" index={index} />
  )
}

function ShortenAndScroll({children}: {children: ReactNode}){
  return <div style={{maxWidth: '20em', overflow: 'scroll'}}>{children}</div>
}

function ProofDisplay({ proof } : { proof: Proof }) {
  if (isDelegation(proof)) {
    const capabilities = proof.capabilities.map(capability => <CapabilityDisplay capability={capability} />)
    const proofs = proof.proofs.map((proof) => <ProofDisplay proof={proof}/>)
    const index: Record<string, ReactNode> = {
      'Root CID': <ShortenAndScroll>{proof.cid.toString()}</ShortenAndScroll>,
      Issuer: <ShortenAndScroll>{proof.issuer.did()}</ShortenAndScroll>,
      Audience: <ShortenAndScroll>{proof.audience.did()}</ShortenAndScroll>,
      Expiration: proof.expiration.toString(),
    }
    return (
      <TableDisplay size="small" index={index}>
        <CollapsableRow header="Capabilities">
          {capabilities}
        </CollapsableRow>
        <CollapsableRow header="Proofs">
          {proofs}
        </CollapsableRow>
        <CollapsableRow header="Facts">
          <FactDisplay facts={proof.facts} />
        </CollapsableRow>
      </TableDisplay>
    )
  } else {
    const index: Record<string, ReactNode> = {
      'Root CID': <ShortenAndScroll>{proof.toString()}</ShortenAndScroll>,
    }
    return <TableDisplay size="small" index={index} />
  }
}

function FactDisplay({ facts } : { facts: any[] }) {
  if (facts.length === 0) {
    return <div style={{fontStyle: 'italic', color: '#666'}}>No facts</div>
  }
  
  const formatFact = (fact: any) => {
    try {
      const dagJsonString = DagJSON.stringify(fact)
      return JSON.stringify(JSON.parse(dagJsonString), null, 2)
    } catch {
      return JSON.stringify(fact, bigIntSafe, 2)
    }
  }
  
  return (
    <div>
      {facts.map((fact, index) => (
        <div key={index} style={{marginBottom: '8px'}}>
          <div style={{fontWeight: 'bold', marginBottom: '4px'}}>Fact {index + 1}:</div>
          <pre style={{
            backgroundColor: '#f5f5f5', 
            padding: '8px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
            margin: 0,
            fontFamily: 'Monaco, Consolas, "Lucida Console", monospace'
          }}>
            {formatFact(fact)}
          </pre>
        </div>
      ))}
    </div>
  )
}

function InvocationTable({invocation} : { invocation : Invocation }) {
  const capabilities = invocation.capabilities.map((capability) => <CapabilityDisplay capability={capability}/>)
  const proofs = invocation.proofs.map((proof) => <ProofDisplay proof={proof}/>)
  const index = {
    Issuer: shortString(invocation.issuer.did(), 60),
    Audience: invocation.audience.did(),
  }
  return (
    <TableDisplay size="small" index={index}>
    <CollapsableRow header="Capabilities">
      {capabilities}
    </CollapsableRow>
    <CollapsableRow header="Proofs">
      {proofs}
    </CollapsableRow>
  </TableDisplay>
  )
}

function InvocationDisplay({invocation} : { invocation : Invocation }) {
  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        { invocation.cid.toString() }
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer>
          <InvocationTable invocation={invocation}/>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  )
}

function CollapsableRow({ header, children} : React.PropsWithChildren<{header:string}>) {
  const [open, setOpen] = useState(false);

  return (
    <Fragment>
      <TableRow>
        <TableCell>
          <IconButton
          aria-label="expand row"
          size="small"
          onClick={() => setOpen(!open)}
        >
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell colSpan={2}>{header}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box>
              {children}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </Fragment>
  )
}
function ReceiptDisplay({receipt} : { receipt : Receipt }) {
  const index = {
    Out: receipt.out.ok ? <pre>{JSON.stringify(receipt.out.ok, bigIntSafe, 2)}</pre> : `Error: ${formatError(receipt.out.error)}`,
  }
  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        { receipt.link().toString() }
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer>
        <TableDisplay size="small" index={index}>
          { isDelegation(receipt.ran) ? 
            <CollapsableRow header="Ran">
              <InvocationTable invocation={receipt.ran} />
            </CollapsableRow>
          :
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Ran</TableCell>
              <TableCell>{receipt.ran.toString()}</TableCell>
            </TableRow>
          }
        </TableDisplay>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  )
}

function MessageDisplay({message} : { message : AgentMessage}) {
  const invocations = message.invocations.map(invocation => <InvocationDisplay invocation={invocation} />)
  const receipts = Array.from(message.receipts.values()).map(receipt => <ReceiptDisplay receipt={receipt} />)
  return <Box>
    { invocations.length > 0 && <Card>
      <CardHeader title="Invocations"></CardHeader>
      <CardContent>
        { invocations }
      </CardContent>
    </Card> }
    { receipts.length > 0 &&
    <Card>
      <CardHeader title="Receipts"></CardHeader>
      <CardContent>
        { receipts }
      </CardContent>
    </Card> }
  </Box>
}

function RequestDisplay({request} : { request: Request}) {
  const message = messageFromRequest(request)
  return <div>{typeof message == 'string' ? message : <MessageDisplay message={message}/>}</div>
}

function ResponseBodyDisplay({ body } : {body : string}) {
  const message = decodeMessage(body)
  return <div>{typeof message == 'string' ? message : <MessageDisplay message={message}/>}</div>
}

function ResponseDisplay({request} : { request: Request}) {
  const [body, setBody] = useState("")
  if (request.response.content.text) {
    let decoded = request.response.content.text
    if (request.response.content.encoding == 'base64') {
      decoded = atob(request.response.content.text)
    }
    setBody(decoded)
  }
  useEffect(() => {
    let ignore = false
    if (isChromeRequest(request)) {
      request.getContent((content, encoding) => {
        if (!ignore) {
          let decoded = content
          if (encoding == 'base64') {
            decoded = atob(content)
          }
          setBody(decoded)
        }
      })
    }
    return () => {
      ignore = true
    }
  }, [request])
  return <ResponseBodyDisplay body={body} />
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function RequestInspector({request, onClose} : {request: Request, onClose: () => void}) {
  const [tabIndex, setTabIndex] = useState(0)
  const status = getRequestStatus(request);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Paper sx={{ height: "100%", overflowY: "scroll" }} elevation={3}>
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', p: 1 }}>
        <FiberManualRecordIcon 
          sx={{ 
            color: getStatusColor(status), 
            fontSize: 16, 
            mr: 1 
          }} 
        />
        <Tooltip title="Close panel">
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
        <Tabs value={tabIndex} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="Request" {...a11yProps(0)} />
          <Tab label="Response" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={tabIndex} index={0}>
        <RequestDisplay request={request}/> 
      </CustomTabPanel> 
      <CustomTabPanel value={tabIndex} index={1}>

      <ResponseDisplay request={request} />
      </CustomTabPanel>
    </Box>
    </Paper>
  );
}

export default RequestInspector;