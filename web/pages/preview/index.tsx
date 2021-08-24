import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import Axios from "axios";

import { useRouter } from "next/router";

import { QuicklookQueryParams } from "@base-sdk/base/features/quicklook";
import Editor, { useMonaco } from "@monaco-editor/react";
import CircularProgress from "@material-ui/core/CircularProgress";

// import FrameFlutter from "../../components/frame-flutter";
import DashboardAppbar from "@app/scene-view/components/appbar/dashboard.appbar";
import Toolbar from "@app/scene-view/components/toolbar";
import { checkFrameSourceMode } from "@base-sdk/base/frame-embed";
import { AppFramework, AppLanguage } from "@base-sdk/base/types";
import Background from "@app/scene-view/components/canves/background";
import { EditorThemeProvider } from "../../../ui/editor-ui/packages/editor-ui-theme";
import { FrameFlutter, TopBar } from "../../../app/components";

interface IQuicklookQueries extends QuicklookQueryParams {
  globalizationRedirect?: string;
}

/**
 * frame or url is required
 * @param frame the frame id of selected node, which uploaded to default bridged quicklook s3 buket.
 * @param url the custom url of the compiled js file. any source is allowed.
 */
export default function Frame() {
  const router = useRouter();
  const [source, setSource] = useState<string>();
  let editingSource: string;
  const query: IQuicklookQueries = {
    id: (router.query.id as string) ?? "",
    framework: (router.query.framework as AppFramework) ?? AppFramework.flutter,
    language: (router.query.language as AppLanguage) ?? AppLanguage.dart,
    url: router.query.url as string,
    name: router.query.name as string,
    w: Number.parseInt(router.query.w as string) ?? 375,
    h: Number.parseInt(router.query.h as string) ?? 812,
    globalizationRedirect:
      (router.query["globalization-redirect"] as string) ?? "#",
  };
  console.info("query for quicklook: ", query);

  useEffect(() => {
    switch (query.framework) {
      case "flutter":
        if (query.url) {
          if (query.language == "js") {
            setSource(query.url);
          } else if (query.language == "dart") {
            // fetch dart file and set as source
            Axios.get(query.url).then((r) => {
              const dartSource = r.data;
              editingSource = dartSource;
              setSource(dartSource);
            });
          }
        }
        break;
      default:
        throw new Error(
          `the framework ${query.framework} is not supported yet.`
        );
    }
  }, [query.url]);

  const run = () => {
    if (editingSource) {
      setSource(editingSource);
    } else {
      alert("your code has no changes");
    }
  };

  return (
    <>
      <EditorThemeProvider light>
        {/* <DashboardAppbar
        title={query.name || "No Name"}
        backButton="DASHBOARD"
        onClickPlay={run}
      /> */}
        <TopBar
          controlDoubleClick={() => {}}
          title={query.name || "No Name"}
          isSimple={true}
        />
        <Wrapper>
          <SideContainer>
            <Background>
              {appFrame({
                id: query.id,
                framework: query.framework,
                source: source!!,
                language: query.language,
              })}
            </Background>
          </SideContainer>
          <SideContainer
            style={{ width: "45vw", background: "#1e1e1e", paddingTop: "70px" }}
          >
            <Toolbar toGlobalization={query.globalizationRedirect}>
              <ButtonList>
                <Button
                  style={{
                    backgroundColor: "#151617",
                  }}
                  onClick={openVSCode}
                >
                  <ButtonIconImage src="/assets/icons/bridged_brand_icons_vscode_white.svg" />
                  <span>VS CODE</span>
                </Button>
                <div style={{ marginLeft: 12 }}></div>
                <Button
                  style={{
                    backgroundColor: "#2562FF",
                  }}
                  onClick={run}
                >
                  <ButtonIconImage src="/assets/icons/mdi_play_circle_filled_round.svg" />
                  <span>Run</span>
                </Button>
              </ButtonList>
            </Toolbar>
            <Editor
              language="dart"
              theme="vs-dark"
              value={source}
              options={{
                unusualLineTerminators: "off",
              }}
              onChange={(value: string) => {
                editingSource = value;
              }}

              // editorDidMount={(
              //   editor: monacoEditor.editor.IStandaloneCodeEditor
              // ) => {
              //   // @ts-ignore
              //   window.MonacoEnvironment.getWorkerUrl = (moduleId, label) => {
              //     if (label === "json") return "/_next/static/json.worker.js";
              //     if (label === "css") return "/_next/static/css.worker.js";
              //     if (label === "html") return "/_next/static/html.worker.js";
              //     if (label === "typescript" || label === "javascript")
              //       return "/_next/static/ts.worker.js";
              //     return "/_next/static/editor.worker.js";
              //   };
              // }}
            />
          </SideContainer>
        </Wrapper>
      </EditorThemeProvider>
    </>
  );
}

function appFrame(props: {
  id: string;
  source: string;
  framework: AppFramework;
  language: AppLanguage;
  widht?: number;
  height?: number;
}) {
  // region check mode
  const mode = checkFrameSourceMode(props.framework, props.source);
  // endregion check mode

  const loading = <CircularProgress />;

  if (!props.source) {
    return loading;
  }

  switch (props.framework) {
    case "flutter":
      if (props.language == "js") {
        return (
          <FrameFlutter width={props.widht} height={props.height}>
            <IFrame
              id={props.id}
              src={`https://frames-appbox.vercel.app/flutter?src=${props.source}&mode=${mode}&language=js`}
            />
          </FrameFlutter>
        );
      } else if (props.language == "dart") {
        return (
          <FrameFlutter width={props.widht} height={props.height}>
            <IFrame
              id={props.id}
              src={`https://frames-appbox.vercel.app/flutter?src=${props.source}&mode=${mode}&language=dart`}
            />
          </FrameFlutter>
        );
      }
      return loading;
    case "react":
      return <p>react framework is not yet supported.</p>;
    default:
      return loading;
  }
}

// opens vs code; code editor for editing this source on developer's local environment.
const openVSCode = () => {
  // todo -- pass params for rerouting on the editor
  window.location.href = "vscode://file";
  // not using this line since its purpose on oppening app on same window.
  // open('vscode://file')
};

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  height: 100vh;
  overflow-y: hidden;
`;

const SideContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const IFrame = styled.iframe`
  background: #ffffff;
  box-shadow: 0px 0px 4px rgba(222, 222, 222, 0.25),
    0px 0px 32px 4px rgba(220, 220, 220, 0.12);
  border-radius: 2px;
`;

const ButtonList = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  color: white;
  padding: 8px 12px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    font-weight: 500;
    font-size: 14px;
    line-height: 1.2;
    text-transform: capitalize;
  }

  &:active,
  &:focus {
    outline: 0;
  }
`;

const ButtonIconImage = styled.img`
  width: 16px;
  height: 16px;
  margin-right: 8px;
`;
