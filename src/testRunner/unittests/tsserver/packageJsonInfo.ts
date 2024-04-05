import { jsonToReadableText } from "../helpers";
import {
    baselineTsserverLogs,
    openFilesForSession,
    TestSession,
} from "../helpers/tsserver";
import {
    createServerHost,
    File,
} from "../helpers/virtualFileSystemWithWatch";

const tsConfig: File = {
    path: "/tsconfig.json",
    content: "{}",
};
const packageJsonContent = {
    dependencies: {
        redux: "*",
    },
    peerDependencies: {
        react: "*",
    },
    optionalDependencies: {
        typescript: "*",
    },
    devDependencies: {
        webpack: "*",
    },
};
const packageJson: File = {
    path: "/package.json",
    content: jsonToReadableText(packageJsonContent),
};

describe("unittests:: tsserver:: packageJsonInfo::", () => {
    it("detects new package.json files that are added, caches them, and watches them", () => {
        // Initialize project without package.json
        const { session, projectService, host } = setup([tsConfig]);
        assert.isUndefined(projectService.packageJsonCache.getInDirectory("/"));

        // Add package.json
        host.writeFile(packageJson.path, packageJson.content);
        session.host.baselineHost("Add package.json");
        let packageJsonInfo = projectService.packageJsonCache.getInDirectory("/")!;
        assert.ok(packageJsonInfo);
        assert.ok(packageJsonInfo.dependencies);
        assert.ok(packageJsonInfo.devDependencies);
        assert.ok(packageJsonInfo.peerDependencies);
        assert.ok(packageJsonInfo.optionalDependencies);

        // Edit package.json
        host.writeFile(
            packageJson.path,
            jsonToReadableText({
                ...packageJsonContent,
                dependencies: undefined,
            }),
        );
        session.host.baselineHost("Edit package.json");
        packageJsonInfo = projectService.packageJsonCache.getInDirectory("/")!;
        assert.isUndefined(packageJsonInfo.dependencies);

        baselineTsserverLogs("packageJsonInfo", "detects new package.json files that are added, caches them, and watches them", session);
    });

    it("finds package.json on demand, watches for deletion, and removes them from cache", () => {
        // Initialize project with package.json
        const { session, projectService, host, project } = setup();
        projectService.getPackageJsonsVisibleToFile("/src/whatever/blah.ts", project);
        assert.ok(projectService.packageJsonCache.getInDirectory("/"));

        // Delete package.json
        host.deleteFile(packageJson.path);
        session.host.baselineHost("delete packageJson");
        assert.isUndefined(projectService.packageJsonCache.getInDirectory("/"));
        baselineTsserverLogs("packageJsonInfo", "finds package.json on demand, watches for deletion, and removes them from cache", session);
    });

    it("finds multiple package.json files when present", () => {
        // Initialize project with package.json at root
        const { session, projectService, host, project } = setup();
        // Add package.json in /src
        host.writeFile("/src/package.json", packageJson.content);
        session.host.baselineHost("packageJson");
        assert.lengthOf(projectService.getPackageJsonsVisibleToFile("/a.ts", project), 1);
        assert.lengthOf(projectService.getPackageJsonsVisibleToFile("/src/b.ts", project), 2);
        baselineTsserverLogs("packageJsonInfo", "finds multiple package.json files when present", session);
    });

    it("handles errors in json parsing of package.json", () => {
        const packageJsonContent = `{ "mod" }`;
        const { session, projectService, host, project } = setup([tsConfig, { path: packageJson.path, content: packageJsonContent }]);
        projectService.getPackageJsonsVisibleToFile("/src/whatever/blah.ts", project);
        const packageJsonInfo = projectService.packageJsonCache.getInDirectory("/")!;
        assert.isFalse(packageJsonInfo.parseable);

        host.writeFile(packageJson.path, packageJson.content);
        session.host.baselineHost("packageJson");
        projectService.getPackageJsonsVisibleToFile("/src/whatever/blah.ts", project);
        const packageJsonInfo2 = projectService.packageJsonCache.getInDirectory("/")!;
        assert.ok(packageJsonInfo2);
        assert.ok(packageJsonInfo2.dependencies);
        assert.ok(packageJsonInfo2.devDependencies);
        assert.ok(packageJsonInfo2.peerDependencies);
        assert.ok(packageJsonInfo2.optionalDependencies);
        baselineTsserverLogs("packageJsonInfo", "handles errors in json parsing of package.json", session);
    });

    it("handles empty package.json", () => {
        const packageJsonContent = "";
        const { session, projectService, host, project } = setup([tsConfig, { path: packageJson.path, content: packageJsonContent }]);
        projectService.getPackageJsonsVisibleToFile("/src/whatever/blah.ts", project);
        const packageJsonInfo = projectService.packageJsonCache.getInDirectory("/")!;
        assert.isFalse(packageJsonInfo.parseable);

        host.writeFile(packageJson.path, packageJson.content);
        session.host.baselineHost("PackageJson");
        projectService.getPackageJsonsVisibleToFile("/src/whatever/blah.ts", project);
        const packageJsonInfo2 = projectService.packageJsonCache.getInDirectory("/")!;
        assert.ok(packageJsonInfo2);
        assert.ok(packageJsonInfo2.dependencies);
        assert.ok(packageJsonInfo2.devDependencies);
        assert.ok(packageJsonInfo2.peerDependencies);
        assert.ok(packageJsonInfo2.optionalDependencies);
        baselineTsserverLogs("packageJsonInfo", "handles empty package.json", session);
    });
});

function setup(files: readonly File[] = [tsConfig, packageJson]) {
    const host = createServerHost(files);
    const session = new TestSession(host);
    openFilesForSession([files[0]], session);
    const projectService = session.getProjectService();
    const getPackageJsonsVisibleToFile = projectService.getPackageJsonsVisibleToFile;
    projectService.getPackageJsonsVisibleToFile = (fileName, project, rootDir) => {
        session.host.baselineHost(`getPackageJsonsVisibleToFile:: ${fileName} ${rootDir}`);
        const result = getPackageJsonsVisibleToFile.call(projectService, fileName, project, rootDir);
        session.host.baselineHost(`getPackageJsonsVisibleToFile:: ${fileName} ${rootDir}:: Result:: ${jsonToReadableText(result)}`);
        return result;
    };
    return { host, session, projectService, project: projectService.inferredProjects[0] };
}
